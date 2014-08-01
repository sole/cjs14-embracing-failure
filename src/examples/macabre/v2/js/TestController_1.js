function TestController(intervalRate, adaptive, context, debugView, scale, gravityX, gravityY) {
	BaseController.call(this, intervalRate, adaptive, context, debugView, scale, gravityX, gravityY);
	
	var self = this;
	
	// 'world bounds'
	var w2 = this.width * 0.5, h2 = this.height * 0.5;

	var boundTop = this.createBody({x: w2/scale, y: 0, width: (this.width-1)/scale, height: 1/scale, type: Body.TYPE_STATIC}); // Top	
	var boundBottom = this.createBody({x: w2/scale, y: this.height/scale, width: (this.width-8)/scale, height: 20/scale, type: Body.TYPE_STATIC}); // Bottom
	var boundLeft = this.createBody({x: 0, y: h2/scale, width: 1/scale, height: this.height/scale, type: Body.TYPE_STATIC}); // Left
	var boundRight = this.createBody({x: this.width/scale, y: h2/scale, width: 1/scale, height: this.height/scale, type: Body.TYPE_STATIC}); // Right
	
	// Ball suspended from 'the roof'
	//var ball = this.createBody({x: w2 / scale, y: h2 / scale, width: 100 / scale, height: 100 / scale, type: Body.TYPE_DYNAMIC, restitution: 0.5});
	var ball = this.createBody({x: w2 / scale, y: h2 / scale, radius: 50 / scale, shape: Body.SHAPE_CIRCLE, type: Body.TYPE_DYNAMIC, restitution: 0.5});
	//this.createRevoluteJoint(boundTop, ball, ball.boxBody.GetWorldCenter());
	this.createDistanceJoint(boundTop, ball);
	
	ball.boxBody.ApplyForce(new Box2D.Common.Math.b2Vec2(5000, -100), ball.boxBody.GetWorldCenter());
	
	// Add skeleton(s)
	for(var i = 0; i < 1; i++) {
		var size = Math.max(0.5, Math.random()) * 200 / scale;
		var sk = this.createSkeleton(
			Math.random() * this.width / scale, // x
			Math.max(10/scale, Math.random() * this.height / scale), // y
			size,
			size * 2
		);
	}
	
	//console.log(this.createBody({x: 2, y: 2, width: 3, height: 3}), this.width);
	// sphere, rectangle, polygon
	
	// Make pumpkin(...)
	// Press T for thunder, L for lightning (??)
	
	// Mouse handling
	var canvasPosition = getElementPosition(context.canvas);
	this.mousePositionVec = new Box2D.Common.Math.b2Vec2(0, 0);
	var mousePositionVec = this.mousePositionVec;
	this.isMouseDown = false;
	this.mouseJoint = null;
	
	function handleMouseMove(e) {
		mousePositionVec.x = (e.clientX - canvasPosition.x) / scale;
		mousePositionVec.y = (e.clientY - canvasPosition.y) / scale;
	}
	
	document.addEventListener('mousedown', function(e) {
		self.isMouseDown = true;
		handleMouseMove(e);
		document.addEventListener('mousemove', handleMouseMove, true);
	}, true);

	document.addEventListener('mouseup', function() {
		document.removeEventListener('mousemove', handleMouseMove, true);
		self.isMouseDown = false;
		mousePositionVec.x = undefined;
		mousePositionVec.y = undefined;
	}, true);
	
	
	// -----------
	
	function getElementPosition(el) {
		var left = el.offsetLeft;
		var top = el.offsetTop;
		var e = el.offsetParent;

		do {
		   left += e.offsetLeft;
			top += e.offsetTop;

		} while (e = e.offsetParent);

		return {x: left, y: top};
	}
}

TestController.prototype = new BaseController();
TestController.prototype.constructor = TestController;

TestController.prototype.update = function() {
	
	if(this.isMouseDown && (!this.mouseJoint)) {
		var boxBody = this.getBodyAtMouse();
		
		if(boxBody) {
			var bodyType = boxBody.GetType();
			if(bodyType === Box2D.Dynamics.b2Body.b2_dynamicBody) {
				var mouseJointDef = new Box2D.Dynamics.Joints.b2MouseJointDef();
				mouseJointDef.bodyA = this.world.GetGroundBody();
				mouseJointDef.bodyB = boxBody;
				mouseJointDef.target.Set(this.mousePositionVec.x, this.mousePositionVec.y);
				mouseJointDef.collideConnected = true;
				//mouseJointDef.dampingRatio = 1.0;
				//mouseJointDef.frequencyHz = 100.0;
				mouseJointDef.maxForce = 300.0 * boxBody.GetMass();
				this.mouseJoint = this.world.CreateJoint(mouseJointDef);
				boxBody.SetAwake(true);
				
			}
		}
	}
	
	if(this.mouseJoint) {
		if(this.isMouseDown) {
			this.mouseJoint.SetTarget(new Box2D.Common.Math.b2Vec2(this.mousePositionVec.x, this.mousePositionVec.y));
		} else {
			this.world.DestroyJoint(this.mouseJoint);
			this.mouseJoint = null;
		}
	}
	
	BaseController.prototype.update.call(this);
	
}

TestController.prototype.getBodyAtMouse = function() {
	var mousePosVec = this.mousePositionVec;
	var aabb = new Box2D.Collision.b2AABB();
	aabb.lowerBound.Set(mousePosVec.x - 0.001, mousePosVec.y - 0.001);
	aabb.upperBound.Set(mousePosVec.x + 0.001, mousePosVec.y + 0.001);

	// Query world for overlapping shapes
	var selectedBody = null;
	
	this.world.QueryAABB(function(fixture) {
		if(fixture.GetBody().GetType() != Box2D.Dynamics.b2Body.b2_staticBody) {
			if(fixture.GetShape().TestPoint(fixture.GetBody().GetTransform(), mousePosVec)) {
				selectedBody = fixture.GetBody();
				return false;
			}
		}
		return true;
	}, aabb);
	return selectedBody;
}

// x, y -> skeleton center
TestController.prototype.createSkeleton = function(x, y, width, height) {
	var skeleton = {};
	var restitution = 0.0;
	console.log('SK', width, height);
	// Head 1/8 (2/16)
	var headRadius = height / 8,
		head = this.createBody({x: x, y: y, radius: headRadius, shape: Body.SHAPE_CIRCLE, type: Body.TYPE_DYNAMIC, restitution: restitution });
	skeleton.head = head;
	
	// Neck 1/16 | accum = 3
	var headCenter = head.boxBody.GetWorldCenter(),
		neckHeight = height / 16,
		neckNumLinks = 3,
		neckLinkHeight = neckHeight / neckNumLinks,
		neck = this.makeChain(
			headCenter.x, headCenter.y + headRadius*1.1, // x, y
			neckLinkHeight * 2, neckLinkHeight * 0.8, // link width & height
			neckLinkHeight * 0.1, // link separation,
			true, // vertical direction?
			 3, // number of links
			 restitution
		);
	this.createRevoluteJoint(head, neck[0]);
	skeleton.neck = neck;
	
	// Torso 4 / 16 | accum = 7
	var neckLastLink = neck[neck.length-1],
		lastLinkCenter = neckLastLink.boxBody.GetWorldCenter(),
		torsoWidth = width * 0.8,
		torsoHeight = height * 4 / 16,
		torso = this.createBody({x: lastLinkCenter.x, y: lastLinkCenter.y + neckLinkHeight*1.1 + torsoHeight / 2, width: torsoWidth, height: torsoHeight, type: Body.TYPE_DYNAMIC, restitution: restitution});
	this.createRevoluteJoint(neckLastLink, torso);
	skeleton.torso = torso;
	
	// Pelvis 2 / 16 | accum = 9
	var torsoCenter = torso.boxBody.GetWorldCenter(),
		pelvis = this.createBody({x: torsoCenter.x, y: torsoCenter.y + torsoHeight / 2, width: width * 0.7, height: height / 8, type: Body.TYPE_DYNAMIC, restitution: restitution});
	this.createRevoluteJoint(torso, pelvis);
	skeleton.pelvis = pelvis;
	
	// Left arm
	var leftArm = this.createBody({x: x - torso
	return (skeleton);	
}

TestController.prototype.makeChain = function(x, y, linkWidth, linkHeight, linkSeparation, vertical, numLinks, restitution) {
	var links = [], _x = x, _y = y, prevLink = null, link;
	
	for(var i = 0; i < numLinks; i++) {
		link = this.createBody({x: _x, y: _y, width: linkWidth, height: linkHeight, shape: Body.SHAPE_RECTANGLE, type: Body.TYPE_DYNAMIC, restitution: restitution});
		links.push(link);

		if(prevLink !== null) {
			//var prevLinkCenter = prevLink.boxBody.GetWorldCenter(),
			//	halfWayPoint = new Box2D.Common.Math.b2Vec2( (prevLinkCenter.x + _x) / 2, (prevLinkCenter.y + _y) / 2);
			//this.createRevoluteJoint(prevLink, link, prevLinkCenter);
			this.createRevoluteJoint(prevLink, link);
		}
		
		if(vertical) {
			_y += linkSeparation;
		} else {
			_x += linkSeparation;
		}
		
		prevLink = link;
	}
	
	return links;
}
