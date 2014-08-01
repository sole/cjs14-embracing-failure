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
	//var ball = this.createBody({x: w2 / scale, y: h2 / scale, radius: 50 / scale, shape: Body.SHAPE_CIRCLE, type: Body.TYPE_DYNAMIC, restitution: 0.5});
	//this.createRevoluteJoint(boundTop, ball, ball.boxBody.GetWorldCenter());
	//this.createDistanceJoint(boundTop, ball);
	//ball.boxBody.ApplyForce(new Box2D.Common.Math.b2Vec2(5000, -100), ball.boxBody.GetWorldCenter());
	
	// Add skeleton(s)
	var prevSk = null, numSkeletons = 1, offset = this.width/(numSkeletons+1);
	for(var i = 0; i < numSkeletons; i++) {
		var size = 170 / scale; //Math.max(0.5, Math.random()) * 150 / scale;
		/*var sk = this.createSkeleton(
			Math.random() * this.width / scale, // x
			Math.random() * this.height/8 / scale, // y
			size,
			size * 2.5
		);*/
		
		var sk = this.createSkeleton(
			offset/scale + (this.width-offset) / scale * (i / (numSkeletons+1)),
			Math.max(0.25, Math.random()) * this.height/4 / scale, // y
			size,
			size * 2.5
		);
		
		var skHeadCenter = sk.head.boxBody.GetWorldCenter();
		//this.createDistanceJoint(boundTop, sk.head, new Box2D.Common.Math.b2Vec2(skHeadCenter.x, 0), skHeadCenter, 4, 0.5);
		
		//sk.torso.boxBody.ApplyForce(new Box2D.Common.Math.b2Vec2(0, -2000 * Math.random()), sk.torso.boxBody.GetWorldCenter());
		 //sk.torso.boxBody.SetAngularVelocity(200 * (Math.random() - 0.5));
		
		/*if(prevSk != null) {
			this.createDistanceJoint(prevSk.rightHand, sk.leftHand);
		}*/
		
		prevSk = sk;
		//this.createDistanceJoint(boundTop, sk.head);
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
		
		e.preventDefault();
		
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
// width, height -> skeleton 'bounding box'
TestController.prototype.createSkeleton = function(x, y, width, height) {
	var skeleton = {};
	var restitution = 0.0;
	
	var twoPI = Math.PI * 2;
	
	// Head 1/8 (2/16)
	var headRadius = height / 16,
		head = this.createBody({ x: x, y: y, radius: headRadius, shape: Body.SHAPE_CIRCLE, restitution: restitution });
	
	head.drawingCallback = function(context) {
		var scale = this.scale;
		context.save();
		
		context.translate((this.x) * this.scale, (this.y) * this.scale);
		context.rotate(this.angle);
		context.translate(-(this.x) * this.scale, -(this.y) * this.scale);
		// skull (unfinished arc)
		context.fillStyle = 'white';
		context.beginPath();
		context.arc(this.x * scale, this.y * this.scale, this.radius * this.scale,  Math.PI / 3, 2 / 3 * Math.PI, true);
		context.closePath();
		context.fill();
		
		// Eyes
		var eyesY = (this.y - this.radius * 0.10) * this.scale;
		var eyeOffsetX = this.radius * 0.4;
		var eyeRadius = this.radius * 0.25 * this.scale;
		
		context.fillStyle = 'rgb(0, 0, 0);';
		
		// left eye
		context.beginPath();
		context.arc((this.x - eyeOffsetX) * this.scale, eyesY, eyeRadius, 0, twoPI, true);
		context.closePath();
		context.fill();
		
		// right eye
		context.beginPath();
		context.arc((this.x + eyeOffsetX) * this.scale, eyesY, eyeRadius, 0, twoPI, true);
		context.closePath();
		context.fill();
		
		// Nose
		var noseWidth = eyeRadius*1.5,
			noseHeight = noseWidth,
			noseOffset = eyeRadius * 0.35,
			noseX = this.x * this.scale,
			noseY = eyesY + noseHeight * 1.5; // XXX
		
		context.beginPath();
		context.moveTo(noseX - noseOffset , noseY);
		context.lineTo(noseX - noseOffset - noseWidth/2, noseY);
		context.lineTo(noseX - noseOffset, noseY - noseHeight);
		context.lineTo(noseX - noseOffset, noseY);
		context.fill();
		context.closePath();
		
		context.beginPath();
		context.moveTo(noseX + noseOffset , noseY);
		context.lineTo(noseX + noseOffset + noseWidth/2, noseY);
		context.lineTo(noseX+ noseOffset, noseY - noseHeight);
		context.lineTo(noseX+ noseOffset, noseY);
		context.fill();
		context.closePath();

		// Teeth
		context.fillStyle = 'white';
		context.lineWidth = 1.0;
		var arc = this.radius * scale * Math.sin(Math.PI / 3),
			numTeeth = 5,
			teethWidth = arc / numTeeth,
			teethX = this.x*this.scale - arc / 2,
			teethY = this.y*this.scale + arc + teethWidth / 2,

			pos = teethX + teethWidth / 2;
		
		for(var i = 0; i < numTeeth; i++) {
			context.beginPath();
			context.arc(pos, teethY, teethWidth/2, 0, twoPI, true);
			context.fill();
			pos += teethWidth;
			context.closePath();
		}
		
		context.restore();
		
	}
	
	skeleton.head = head;
	
	// Neck 1/16 | accum = 3
	var headCenter = head.boxBody.GetWorldCenter(),
		neckHeight = height / 16,
		neckNumLinks = 3,
		neckLinkHeight = neckHeight / neckNumLinks,
		neck = this.makeChain(
			headCenter.x, headCenter.y + headRadius + neckLinkHeight/2, // x, y
			neckLinkHeight * 1.5, neckLinkHeight * 0.8, // link width & height
			neckLinkHeight * 0.2, // link separation,
			true, // vertical direction?
			3, // number of links
			restitution,
			-15/180 * Math.PI,
			15/180 * Math.PI
		);
	this.createRevoluteJoint(head, neck[0], null, -15/180*Math.PI, 15/180*Math.PI);
	var neckDrawingCallback = function(context) {
		context.save();
		context.translate(this.x * this.scale, this.y * this.scale);
		context.rotate(this.angle);
		context.translate(-(this.x) * this.scale, -(this.y) * this.scale);
		context.fillStyle = 'white';
		var mult = 0.6;
		
		context.beginPath();
		context.fillRect((this.x-this.halfWidth) * this.scale,
				   (this.y-this.halfHeight * mult) * this.scale,
				   (this.width) * this.scale,
				   (this.height * mult) * this.scale);
		context.fill();
		context.closePath();
		context.restore();

		
	}
	for(var i = 0; i < neck.length; i++) {
		neck[i].drawingCallback = neckDrawingCallback;	
	}
	skeleton.neck = neck;
	
	// Torso 4 / 16 | accum = 7
	var neckLastLink = neck[neck.length-1],
		lastLinkCenter = neckLastLink.boxBody.GetWorldCenter(),
		torsoWidth = width * 0.8,
		torsoHeight = height * 4 / 16,
		torso = this.createBody({x: lastLinkCenter.x, y: lastLinkCenter.y + neckLinkHeight/2 + torsoHeight / 2, width: torsoWidth, height: torsoHeight, restitution: restitution});
		torso.drawingCallback = function(context) {
			context.save();
			context.translate(this.x * this.scale, this.y * this.scale);
			context.rotate(this.angle);
			context.translate(-(this.x) * this.scale, -(this.y) * this.scale);
			
			// sternum
			var sternumWidth = this.width * 0.1,
				halfSternumWidth = sternumWidth * 0.5,
				sternumHeight = this.height * 0.6,
				halfSternumHeight = sternumHeight * 0.5;
			
			context.fillStyle = 'white';
			context.fillRect(
				(this.x - halfSternumWidth) * this.scale,
				(this.y - this.halfHeight) * this.scale,
				sternumWidth * this.scale,
				sternumHeight * this.scale
			);
			
			context.restore();
		}
	this.createRevoluteJoint(neckLastLink, torso, null, -15/180 * Math.PI, 15/180 * Math.PI);
	skeleton.torso = torso;
	
	// Pelvis 2 / 16 | accum = 9
	var torsoCenter = torso.boxBody.GetWorldCenter(),
		pelvisHeight = height / 8,
		pelvis = this.createBody({x: torsoCenter.x, y: torsoCenter.y + torsoHeight / 2 + pelvisHeight/2, width: width * 0.6, height: pelvisHeight, restitution: restitution});
	
	this.createRevoluteJoint(torso, pelvis, null, -15/180 * Math.PI, Math.PI * 15/180);
	skeleton.pelvis = pelvis;
	
	// Arms
	var	torsoLeft = x - torsoWidth / 2,
		torsoRight = x + torsoWidth / 2,
		torsoTop = torsoCenter.y - torsoHeight / 2,
		humerusHeight = height * 3 / 16.0,
		radiusHeight = height * 3 / 16.0,
		armWidth = width / 16,
		fingerWidth = armWidth / 4,
		littleFingerHeight = height / 18 * 2,
		ringFingerHeight = height / 15 * 2,
		midFingerHeight = height / 13 * 2,
		indexFingerHeight = height / 16 * 2,
		thumbFingerHeight = height / 30 * 2;
	
	// Left arm
	var leftHumerus = this.createBody({x: torsoLeft, y: torsoTop + humerusHeight / 2, width: armWidth, height: humerusHeight, restitution: restitution});
	this.createRevoluteJoint(torso, leftHumerus, new Box2D.Common.Math.b2Vec2(torsoLeft, torsoTop), -85/180*Math.PI, 130/180*Math.PI);

	var leftRadius = this.createBody({x: torsoLeft, y: torsoTop + humerusHeight + radiusHeight / 2, width: armWidth, height: radiusHeight, restitution: restitution});
	this.createRevoluteJoint(leftHumerus, leftRadius, null, -130/180*Math.PI, 10/180*Math.PI);
	
	var leftRadiusCenter = leftRadius.boxBody.GetWorldCenter(),
		leftRadiusLeft = leftRadiusCenter.x - armWidth / 2,
		radiusEndY = leftRadiusCenter.y + humerusHeight / 2;
	
	// left hand
	var leftLittleFinger = this.createBody({x: leftRadiusLeft + fingerWidth/2, y: radiusEndY + littleFingerHeight / 2, width: fingerWidth, height: littleFingerHeight, restitution: restitution}),
		leftLittleFingerCenter = leftLittleFinger.boxBody.GetWorldCenter();
	this.createRevoluteJoint(leftRadius, leftLittleFinger, new Box2D.Common.Math.b2Vec2(leftRadiusLeft, radiusEndY), -15/180 * Math.PI, Math.PI * 15/180);
	
	var leftRingFinger = this.createBody({x: leftLittleFingerCenter.x + fingerWidth , y: radiusEndY + ringFingerHeight / 2, width: fingerWidth, height: ringFingerHeight, restitution: restitution}),
		leftRingFingerCenter = leftRingFinger.boxBody.GetWorldCenter();
	this.createRevoluteJoint(leftRadius, leftRingFinger, new Box2D.Common.Math.b2Vec2(leftRingFingerCenter.x, radiusEndY), -15/180 * Math.PI, Math.PI * 15/180);
		
	var leftMidFinger = this.createBody({x: leftRingFingerCenter.x + fingerWidth , y: radiusEndY + midFingerHeight / 2, width: fingerWidth, height: midFingerHeight, restitution: restitution}),
		leftMidFingerCenter = leftMidFinger.boxBody.GetWorldCenter();
	this.createRevoluteJoint(leftRadius, leftMidFinger, new Box2D.Common.Math.b2Vec2(leftMidFingerCenter.x, radiusEndY), -15/180 * Math.PI, Math.PI * 15/180);
	
	var leftIndexFinger = this.createBody({x: leftMidFingerCenter.x + fingerWidth , y: radiusEndY + indexFingerHeight / 2, width: fingerWidth, height: indexFingerHeight, restitution: restitution}),
		leftIndexFingerCenter = leftIndexFinger.boxBody.GetWorldCenter();
	this.createRevoluteJoint(leftRadius, leftIndexFinger, new Box2D.Common.Math.b2Vec2(leftIndexFingerCenter.x, radiusEndY), -15/180 * Math.PI, Math.PI * 15/180);
	
	var leftThumbFinger = this.createBody({x: leftIndexFingerCenter.x + fingerWidth , y: radiusEndY + thumbFingerHeight / 2, width: fingerWidth, height: thumbFingerHeight, restitution: restitution}),
		leftThumbFingerCenter = leftThumbFinger.boxBody.GetWorldCenter();
	this.createRevoluteJoint(leftRadius, leftThumbFinger, new Box2D.Common.Math.b2Vec2(leftThumbFingerCenter.x, radiusEndY), -70/180*Math.PI, 45/180*Math.PI);
	
	skeleton.leftArm = leftHumerus;
	skeleton.leftHand = leftMidFinger;
	
	// Right arm
	var rightHumerus = this.createBody({x: torsoRight, y: torsoTop + humerusHeight / 2, width: armWidth, height: humerusHeight, restitution: restitution});
	this.createRevoluteJoint(torso, rightHumerus, new Box2D.Common.Math.b2Vec2(torsoRight, torsoTop), -130/180*Math.PI, 85/180*Math.PI);
	
	var rightRadius = this.createBody({x: torsoRight, y: torsoTop + humerusHeight + radiusHeight / 2, width: armWidth, height: radiusHeight, restitution: restitution}),
		rightRadiusCenter = rightRadius.boxBody.GetWorldCenter(),
		rightRadiusRight = rightRadiusCenter.x + armWidth / 2;
	this.createRevoluteJoint(rightHumerus, rightRadius, null, -10/180*Math.PI, 130/180*Math.PI);

	var rightLittleFinger = this.createBody({x: rightRadiusRight - fingerWidth/2, y: radiusEndY + littleFingerHeight / 2, width: fingerWidth, height: littleFingerHeight, restitution: restitution}),
		rightLittleFingerCenter = rightLittleFinger.boxBody.GetWorldCenter();
	this.createRevoluteJoint(rightRadius, rightLittleFinger, new Box2D.Common.Math.b2Vec2(rightLittleFingerCenter.x, radiusEndY), -15/180 * Math.PI, Math.PI * 15/180);
	
	var rightRingFinger = this.createBody({x: rightLittleFingerCenter.x - fingerWidth, y: radiusEndY + ringFingerHeight / 2, width: fingerWidth, height: ringFingerHeight, restitution: restitution}),
		rightRingFingerCenter = rightRingFinger.boxBody.GetWorldCenter();
	this.createRevoluteJoint(rightRadius, rightRingFinger, new Box2D.Common.Math.b2Vec2(rightRingFingerCenter.x, radiusEndY), -15/180 * Math.PI, Math.PI * 15/180);

	var rightMidFinger = this.createBody({x: rightRingFingerCenter.x - fingerWidth , y: radiusEndY + midFingerHeight / 2, width: fingerWidth, height: midFingerHeight, restitution: restitution}),
		rightMidFingerCenter = rightMidFinger.boxBody.GetWorldCenter();
	this.createRevoluteJoint(rightRadius, rightMidFinger, new Box2D.Common.Math.b2Vec2(rightMidFingerCenter.x, radiusEndY), -15/180 * Math.PI, Math.PI * 15/180);
	
	var rightIndexFinger = this.createBody({x: rightMidFingerCenter.x - fingerWidth , y: radiusEndY + indexFingerHeight / 2, width: fingerWidth, height: indexFingerHeight, restitution: restitution}),
		rightIndexFingerCenter = rightIndexFinger.boxBody.GetWorldCenter();
	this.createRevoluteJoint(rightRadius, rightIndexFinger, new Box2D.Common.Math.b2Vec2(rightIndexFingerCenter.x, radiusEndY), -15/180 * Math.PI, Math.PI * 15/180);
	
	var rightThumbFinger = this.createBody({x: rightIndexFingerCenter.x - fingerWidth , y: radiusEndY + thumbFingerHeight / 2, width: fingerWidth, height: thumbFingerHeight, restitution: restitution}),
		rightThumbFingerCenter = rightThumbFinger.boxBody.GetWorldCenter();
	this.createRevoluteJoint(rightRadius, rightThumbFinger, new Box2D.Common.Math.b2Vec2(rightThumbFingerCenter.x, radiusEndY), -70/180*Math.PI, 45/180*Math.PI);
	
	skeleton.rightArm = rightHumerus;
	skeleton.rightHand = rightMidFinger;
	
	// Legs
	var pelvisCenter = pelvis.boxBody.GetWorldCenter(),
		legWidth = width / 16,
		legOffset = headRadius,
		femurHeight = height / 8 * 2,
		tibiaHeight = femurHeight,
		femurCanvas = document.createElement('canvas');/*,
		femurCanvasContext = femurCanvas.getContext('2d'); ,
		femurCanvasContext.drawSvg('bone.svg', 0, 0, legWidth, femurHeight),
		femurCanvasBitmap = femurCanvas.toDataURL(),
		femurDrawingCallback = function(context) {
		};*/

	

	var leftFemur = this.createBody({x: x - legOffset, y: pelvisCenter.y + pelvisHeight / 2 + femurHeight/2, width: legWidth, height: femurHeight, restitution: restitution}),
		leftFemurCenter = leftFemur.boxBody.GetWorldCenter();
	this.createRevoluteJoint(pelvis, leftFemur, new Box2D.Common.Math.b2Vec2(leftFemurCenter.x, leftFemurCenter.y - femurHeight/2), -30/180 * Math.PI, Math.PI * 30/180);
	var leftTibia = this.createBody({x: leftFemurCenter.x, y: leftFemurCenter.y + femurHeight / 2 + tibiaHeight/2, width: legWidth, height: tibiaHeight, restitution: restitution}),
		leftTibiaCenter = leftTibia.boxBody.GetWorldCenter();
	this.createRevoluteJoint(leftFemur, leftTibia, new Box2D.Common.Math.b2Vec2(leftFemurCenter.x, leftFemurCenter.y + femurHeight/2), -15/180 * Math.PI, Math.PI * 15/180);	
	skeleton.leftLeg = leftFemur;
	
	var rightFemur = this.createBody({x: x + legOffset, y: pelvisCenter.y + pelvisHeight / 2 + femurHeight/2, width: legWidth, height: femurHeight, restitution: restitution}),
		rightFemurCenter = rightFemur.boxBody.GetWorldCenter();
	this.createRevoluteJoint(pelvis, rightFemur, new Box2D.Common.Math.b2Vec2(rightFemurCenter.x, rightFemurCenter.y - femurHeight/2), -30/180 * Math.PI, Math.PI * 30/180);
	var rightTibia = this.createBody({x: rightFemurCenter.x, y: rightFemurCenter.y + femurHeight / 2 + tibiaHeight/2, width: legWidth, height: tibiaHeight, restitution: restitution}),
		rightTibiaCenter = rightTibia.boxBody.GetWorldCenter();
	this.createRevoluteJoint(rightFemur, rightTibia, new Box2D.Common.Math.b2Vec2(rightFemurCenter.x, rightFemurCenter.y + femurHeight/2), -15/180 * Math.PI, Math.PI * 15/180);
	
	skeleton.rightLeg = rightFemur;


	/*canvg(femurCanvas, 'bone.svg', {
		ignoreMouse: true,
		ignoreAnimation: true,
		offsetX: 0,
		offsetY: 0,
		scaleWidth: legWidth*this.scale,
		scaleHeight: femurHeight*this.scale,
		renderCallback: function() {
				console.log('ya SVG', arguments, this, femurCanvas);
				
				function renderFemur(context) {
					
					context.save();
					context.translate(this.x * this.scale, this.y * this.scale);
					context.rotate(this.angle);
					context.translate(-(this.x) * this.scale, -(this.y) * this.scale);
					
					//context.drawImage(femurCanvas, -this.halfWidth, -this.halfHeight, this.width*this.scale, this.height*this.scale);
					context.drawImage(femurCanvas, (this.x - this.halfWidth)* this.scale, (this.y - this.halfHeight) * this.scale, this.width*this.scale, this.height*this.scale);
					
					context.restore();
				}
				
				leftFemur.drawingCallback = renderFemur;
				leftTibia.drawingCallback = renderFemur;
				rightFemur.drawingCallback = renderFemur;
				rightTibia.drawingCallback = renderFemur;
			}
		});*/
	
	this.useSVGForBody([leftFemur, rightFemur], 'bone.svg');
		
	return (skeleton);	
}

TestController.prototype.useSVGForBody = function(body, svgFile) {
	var canvas = document.createElement('canvas');
	
	canvg(canvas, svgFile, {
		ignoreMouse: true,
		ignoreAnimation: true,
		offsetX: 0,
		offsetY: 0,
		scaleWidth: body.width * body.scale,
		scaleHeight: body.height * body.scale,
		renderCallback: function() {
				
				function renderBitmap(context) {
					
					context.save();
					context.translate(this.x * this.scale, this.y * this.scale);
					context.rotate(this.angle);
					context.translate(-(this.x) * this.scale, -(this.y) * this.scale);
					
					context.drawImage(canvas, (this.x - this.halfWidth)* this.scale, (this.y - this.halfHeight) * this.scale, this.width*this.scale, this.height*this.scale);
					
					context.restore();
				}
				
				if(body instanceof Array) {
					for(var i = 0; i < body.length; i++) {
						body[i].drawingCallback = renderBitmap;
					}
				} else {
					body.drawingCallback = renderBitmap;
				}
			}
	});
}

TestController.prototype.makeChain = function(x, y, linkWidth, linkHeight, linkSeparation, vertical, numLinks, restitution, lowerAngle, upperAngle) {
	var links = [], _x = x, _y = y, prevLink = null, link;
	
	for(var i = 0; i < numLinks; i++) {
		link = this.createBody({x: _x, y: _y, width: linkWidth, height: linkHeight, shape: Body.SHAPE_RECTANGLE, restitution: restitution});
		links.push(link);

		if(prevLink !== null) {
			var prevLinkCenter = prevLink.boxBody.GetWorldCenter(),
				halfWayPoint = new Box2D.Common.Math.b2Vec2( prevLinkCenter.x, prevLinkCenter.y + linkHeight/2);
			//this.createRevoluteJoint(prevLink, link, prevLinkCenter);
			this.createRevoluteJoint(prevLink, link, halfWayPoint, lowerAngle, upperAngle);
		}
		
		if(vertical) {
			_y += linkSeparation + linkHeight;
		} else {
			_x += linkSeparation + linkWidth;
		}
		
		prevLink = link;
	}
	
	return links;
}
