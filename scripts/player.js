import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';


export class Player {
  radius = 0.5;
  height = 1.75;

  maxSpeed = 10;
  input = new THREE.Vector3();
  velocity = new THREE.Vector3();

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 200);
  controls = new PointerLockControls(this.camera, document.body);
  cameraHelper = new THREE.CameraHelper(this.camera);

  constructor(scene) {
    this.camera.position.set(32, 16, 32);
    scene.add(this.camera);
    scene.add(this.cameraHelper);
    document.addEventListener('keydown', this.onKeyDown.bind(this));
    document.addEventListener('keyup', this.onKeyUp.bind(this));

    // Wireframe mesh visualizing the player's bounding cylinder
    this.boundsHelper = new THREE.Mesh(
      new THREE.CylinderGeometry(this.radius, this.radius, this.height, 16),
      new THREE.MeshBasicMaterial({ wireframe: true })
    );
    scene.add(this.boundsHelper);
  }

  applyInputs(dt) {
    if (this.controls.isLocked) {
      this.velocity.x = this.input.x;
      this.velocity.z = this.input.z;
      this.controls.moveRight(this.velocity.x * dt);
      this.controls.moveForward(this.velocity.z * dt);

      document.getElementById('player-position').innerHTML = this.toString();
    }
  }

  /**
   * Updates the position of the player's bounding cylinder helper
   */
  updateBoundsHelper() {
    this.boundsHelper.position.copy(this.position);
    this.boundsHelper.position.y -= this.height / 2;
  }

  /**
   * @returns {string}
   */
  toString() {
    return `x: ${this.camera.position.x}, y: ${this.camera.position.y}, z: ${this.camera.position.z}`;
  }

  /**
   * @type {THREE.Vector3}
   */
  get position() {
    return this.camera.position;
  }


    /**
   * Event handler for keyup events
   * @param {KeyboardEvent} event 
   */

  /**
   * @type {THREE.Vector3}
   */
  get position() {
    return this.camera.position;
  }


    /**
   * Event handler for keyup events
   * @param {KeyboardEvent} event 
   */
    onKeyUp(event) {
      switch (event.code) {
        case 'KeyW':
          this.input.z = 0;
          break;
        case 'KeyA':
          this.input.x = 0;
          break;
        case 'KeyS':
          this.input.z = 0;
          break;
        case 'KeyD':
          this.input.x = 0;
          break;
      }
    }

  /**
   * Event handler for keydown events
   * @param {KeyboardEvent} event 
   */
  onKeyDown(event) {
    if(!this.controls.isLocked) {
      this.controls.lock();
      console.log('controls locked');
    }

    switch(event.code) {
      case 'KeyW':
        this.input.z = this.maxSpeed;
        break;
      case 'KeyA':
        this.input.x = -this.maxSpeed;
        break;
      case 'KeyS':
        this.input.z = -this.maxSpeed;
        break;
      case 'KeyD':
        this.input.x = this.maxSpeed;
        break;
      case 'KeyR':
        this.position.set(32, 16, 32);
        this.velocity.set(0, 0, 0);
        break;
    }
  }

  /**
   * Returns player position in a readable string form
   * @returns {string}
   */
  toString() {
    let str = '';
    str += `X: ${this.position.x.toFixed(3)}`;
    str += `Y: ${this.position.y.toFixed(3)}`;
    str += `Z: ${this.position.z.toFixed(3)}`;
    return str;
  }
}
