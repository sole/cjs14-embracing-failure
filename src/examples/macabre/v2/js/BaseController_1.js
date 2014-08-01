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
	this.context.clearRect(0, 0, this.width, this.height);

	if(this.debugView) {
		this.world.DrawDebugData();
	}
	
	for(var id in this.bodies) {
		this.bodies[id].draw(this.context);
	}
}

// Sort of factory-like method
BaseController.prototype.createBody = function(def) {
	var id = def.id || 'id_' + Date.now().toString();

	var b = null;
	var nullPoint = {x: null, y: null};
	var shape = def.shape || Body.SHAPE_RECTANGLE;
	
	switch(shape) {
		case Body.SHAPE_RECTANGLE:
			b = new BodyRectangle(def.id, def.x, def.y, nullPoint, def.width, def.height);
			break;
	}

	if(b !== null) {
		b.id = id;
		b.scale = (def.scale || this.scale);
	
		// Fixture
		var fixtureDef = new Box2D.Dynamics.b2FixtureDef();
		fixtureDef.density = def.density || 0.0;
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

		if(b instanceof BodyRectangle) {
			fixtureDef.shape = new Box2D.Collision.Shapes.b2PolygonShape();
			fixtureDef.shape.SetAsBox(b.halfWidth, b.halfHeight);
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


// ----- Bodies -----

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

// ----- Joints -----



