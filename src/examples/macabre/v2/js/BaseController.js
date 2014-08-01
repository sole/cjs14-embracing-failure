function BaseController(intervalRate, adaptive, context, debugView, scale, gravityX, gravityY) {
	if(arguments.length) {
		this.intervalRate = parseInt(intervalRate);
		this.adaptive = adaptive;
		this.context = context;
		this.width = context.canvas.width;
		this.height = context.canvas.height;
		this.debugView = debugView;
		var debugDraw = new Box2D.Dynamics.b2DebugDraw();
		debugDraw.SetSprite(context);
		debugDraw.SetDrawScale(scale);
		debugDraw.SetFillAlpha(0.5);
		debugDraw.SetLineThickness(1.0);
		debugDraw.SetFlags(Box2D.Dynamics.b2DebugDraw.e_shapeBit | Box2D.Dynamics.b2DebugDraw.e_jointBit);
	
		this.scale = scale;
		this.gravityX = gravityX;
		this.gravityY = gravityY;
	
		this.world = new Box2D.Dynamics.b2World(new Box2D.Common.Math.b2Vec2(gravityX, gravityY), true /* sleep */);
		this.world.SetDebugDraw(debugDraw);
		this.debugDraw = debugDraw;
	
		this.bodies = {};
		this.boxBodies = {};
	
		this.lastTimestamp = 0;
	}
}

BaseController.prototype.update = function() {
	var start = Date.now(),
		stepRate = (this.adaptive) ? (now - this.lastTimestamp) / 1000 : (1 / this.intervalRate);
		
	this.world.Step(stepRate, 10, 10);
	this.world.ClearForces();
	
	// updateStates
	for(id in this.bodies) {
		var body = this.bodies[id];
		var boxBody = body.boxBody;
		if(boxBody.IsActive()) {
			var position = boxBody.GetPosition();
			var center = boxBody.GetWorldCenter();
			body.update({x: position.x, y: position.y, center: {x: center.x, y: center.y}, angle: boxBody.GetAngle()});
		}
	}
	
	return(Date.now() - start);
}

BaseController.prototype.draw = function() {
	//this.context.clearRect(0, 0, this.width, this.height);
	this.context.fillStyle = 'black';
	this.context.fillRect(0, 0, this.width, this.height);

	if(this.debugView) {
		this.world.DrawDebugData();
	}
	
	for(var id in this.bodies) {
		this.bodies[id].draw(this.context);
	}
}

// Sort of factory-like method
BaseController.prototype.createBody = function(def) {
	var id = def.id || 'id_' + Date.now().toString() + (Math.random());

	var b = null;
	var nullPoint = {x: null, y: null};
	var shape = def.shape || Body.SHAPE_RECTANGLE;
	
	switch(shape) {
		case Body.SHAPE_RECTANGLE:
			b = new BodyRectangle(def.id, def.x, def.y, nullPoint, def.width, def.height);
			break;
		case Body.SHAPE_CIRCLE:
			b = new BodyCircle(def.id, def.x, def.y, nullPoint, def.radius);
			break;
	}

	if(b !== null) {
		b.id = id;
		b.scale = (def.scale || this.scale);
	
		// Fixture
		var fixtureDef = new Box2D.Dynamics.b2FixtureDef();
		fixtureDef.density = def.density || 1.0;
		fixtureDef.friction = def.friction || 1.0;
		fixtureDef.restitution = def.restitution || 0.0;
		
		// Body
		var bodyDef = new Box2D.Dynamics.b2BodyDef();
		
		if(def.type === Body.TYPE_STATIC) {
			bodyDef.type = Box2D.Dynamics.b2Body.b2_staticBody;
		} else if(def.type === Body.TYPE_KINEMATIC) {
			bodyDef.type = Box2D.Dynamics.b2Body.b2_kinematicBody;
		} else {
			bodyDef.type = Box2D.Dynamics.b2Body.b2_dynamicBody;			
		}

		if(shape === Body.SHAPE_RECTANGLE) {
			fixtureDef.shape = new Box2D.Collision.Shapes.b2PolygonShape();
			fixtureDef.shape.SetAsBox(b.halfWidth, b.halfHeight);
		} else if(shape === Body.SHAPE_CIRCLE) {
			fixtureDef.shape = new Box2D.Collision.Shapes.b2CircleShape(def.radius);
			
		} else {
			console.warn('Did you forget to implement a shape...?');
		}
		
		bodyDef.position.x = def.x;
		bodyDef.position.y = def.y;
		bodyDef.userData = id;
					
		bodyDef.fixedRotation = (def.fixedRotation) ? true : false;
					
		var boxBody = this.world.CreateBody(bodyDef);
		boxBody.CreateFixture(fixtureDef);
		b.boxBody = boxBody;
		
		this.boxBodies[id] = boxBody;
		this.bodies[id] = b;
		
		console.log('create', boxBody, b);
	}
	
	return b;
}

// If anchorpoint is not specified, we'll use the geometric center between bodies as anchor point
BaseController.prototype.createRevoluteJoint = function(bodyA, bodyB, anchorPoint, angle1, angle2) {
	var joint = new Box2D.Dynamics.Joints.b2RevoluteJointDef(),
		center = new Box2D.Common.Math.b2Vec2(),
		_anchorPoint;
		
	if(anchorPoint) {
		_anchorPoint = anchorPoint;
	} else {
		console.log('creando anchor');
		_anchorPoint = new Box2D.Common.Math.b2Vec2();
		var posA = bodyA.boxBody.GetWorldCenter(),
			posB = bodyB.boxBody.GetWorldCenter();
		_anchorPoint.x = (posA.x + posB.x) / 2;
		_anchorPoint.y = (posA.y + posB.y) / 2;
	}
		
	center.Set(_anchorPoint.x, _anchorPoint.y);
	joint.Initialize(bodyA.boxBody, bodyB.boxBody, center);

	if((angle1 !== 'undefined') && (angle2 !== 'undefined')) {
		console.log(arguments);
		console.log('revolute con angle', angle1, angle2);
		joint.lowerAngle = angle1;
		joint.upperAngle = angle2;
		joint.enableLimit = true;
	}
	
	this.world.CreateJoint(joint);
}

/*
	If anchors are not specified we'll use the center of each body
*/
BaseController.prototype.createDistanceJoint = function(bodyA, bodyB, _anchorA, _anchorB, frequency, dampingRatio) {
	var anchorA = _anchorA || bodyA.boxBody.GetWorldCenter(),
		anchorB = _anchorB || bodyB.boxBody.GetWorldCenter(),
		joint = new Box2D.Dynamics.Joints.b2DistanceJointDef();
		
	joint.Initialize(bodyA.boxBody, bodyB.boxBody, anchorA, anchorB);
	
	if(frequency) {
		joint.frequency = frequency;
	}
	if(dampingRatio) {
		joint.dampingRatio = dampingRatio;
	}
	
	this.world.CreateJoint(joint);
}



function Body(id, x, y, center) {
	if(arguments.length) {
		this.id = id;
		this.x = x;
		this.y = y;
		this.angle = 0;
		this.center = center;
		this.scale = 1.0;
		this.type = Body.TYPE_DYNAMIC;
		this.fixedRotation = false;
		this.boxBody = null;
	}
}

Body.TYPE_DYNAMIC = 0;
Body.TYPE_KINEMATIC = 1;
Body.TYPE_STATIC = 2;

Body.SHAPE_RECTANGLE = 0;
Body.SHAPE_CIRCLE = 1;


Body.prototype.update = function(state) {
	this.x = state.x;
	this.y = state.y;
	this.center = state.center;
	this.angle = state.angle;
}

Body.prototype.draw = function(context) {
	context.fillStyle = 'black';
	context.beginPath();
	context.arc(this.x * this.scale, this.y * this.scale, 4, 0, Math.PI * 2, true);
	context.closePath();
	context.fill();
	
	context.fillStyle = 'yellow';
	context.beginPath();
	context.arc(this.center.x * this.scale, this.center.y * this.scale, 2, 0, Math.PI * 2, true);
	context.closePath();
	context.fill();
}

// ~~~

function BodyRectangle(id, x, y, center, width, height) {
	Body.call(this, id, x, y, center);
	
	this.width = width;
	this.height = height;
	this.halfWidth = width * 0.5;
	this.halfHeight = height * 0.5;
}

BodyRectangle.prototype = new Body();
BodyRectangle.prototype.constructor = BodyRectangle;

BodyRectangle.prototype.draw = function(context) {
	context.save();
	context.translate(this.x * this.scale, this.y * this.scale);
	context.rotate(this.angle);
	context.translate(-(this.x) * this.scale, -(this.y) * this.scale);
	context.fillStyle = 'white'; // TODO configurable
	context.fillRect((this.x-this.halfWidth) * this.scale,
			   (this.y-this.halfHeight) * this.scale,
			   (this.width) * this.scale,
			   (this.height) * this.scale);
	context.restore();

	Body.prototype.draw.call(this, context);
}

// ~~~

function BodyCircle(id, x, y, center, radius) {
	Body.call(this, id, x, y, center);
	this.radius = radius;
}
BodyCircle.prototype = new Body();
BodyCircle.prototype.constructor = BodyCircle;

BodyCircle.prototype.draw = function(context) {
	context.fillStyle = 'white'; // TODO configurable
	context.beginPath();
	context.arc(this.x * this.scale, this.y * this.scale, this.radius * this.scale, 0, Math.PI * 2, true);
	context.closePath();
	context.fill();
	
	Body.prototype.draw.call(this, context);
}

