// threejs-script.js
import * as THREE from 'https://threejs.org/build/three.module.js';

class Polygon {
    constructor(vertices, color = 0xffa500) {
        this.vertices = vertices.map(v => new THREE.Vector2(v.x, v.y));
        this.color = color;
        this.mesh = this.createPolygon();
    }

    createPolygon() {
        const shape = new THREE.Shape(this.vertices);
        const geometry = new THREE.ShapeGeometry(shape);
        const material = new THREE.MeshBasicMaterial({ color: this.color, side: THREE.DoubleSide });
        return new THREE.Mesh(geometry, material);
    }

    addToScene(scene) {
        scene.add(this.mesh);
    }

    removeFromScene(scene) {
        scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
    }

    clone() {
        return new Polygon(this.vertices, this.color);
    }
}

let scene, camera, renderer;
let plane, gridHelper;
let vertices = [];
let polygon = null;
let isComplete = false;
let copiedPolygons = [];
let lines = [];
let movingCopy = null;
let isMovingCopy = false;

export function init() {
    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(-5, 5, 5, -5, 0.1, 1000);
    camera.position.set(0, 0, 10);
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const planeGeometry = new THREE.PlaneGeometry(10, 10);
    const planeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    plane = new THREE.Mesh(planeGeometry, planeMaterial);
    scene.add(plane);

    gridHelper = new THREE.GridHelper(10, 10, 0x000000, 0x000000); // Green grid lines
    gridHelper.rotation.x = Math.PI / 2;
    scene.add(gridHelper);

    renderer.domElement.addEventListener('click', onMouseClick);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    document.getElementById('completeBtn').addEventListener('click', (event) => { event.stopPropagation(); completePolygon(); });
    document.getElementById('copyBtn').addEventListener('click', (event) => { event.stopPropagation(); copyPolygon(); });
    document.getElementById('resetBtn').addEventListener('click', (event) => { event.stopPropagation(); resetScene(); });

    animate();
}

function onMouseClick(event) {
    if (isMovingCopy) {
        copiedPolygons.push(movingCopy);
        isMovingCopy = false;
        movingCopy = null;
        return;
    }
    if (event.target.tagName === 'BUTTON' || isComplete) return;
    const rect = renderer.domElement.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 10 - 5;
    const y = -(((event.clientY - rect.top) / rect.height) * 10 - 5);
    vertices.push(new THREE.Vector3(x, y, 0));
    drawVertices();
}

function onMouseMove(event) {
    if (isMovingCopy && movingCopy) {
        const rect = renderer.domElement.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 10 - 5;
        const y = -(((event.clientY - rect.top) / rect.height) * 10 - 5);
        movingCopy.mesh.position.set(x, y, 0);
    }
}

function drawVertices() {
    lines.forEach(line => scene.remove(line));
    lines = [];
    for (let i = 1; i < vertices.length; i++) {
        const geometry = new THREE.BufferGeometry().setFromPoints([vertices[i - 1], vertices[i]]);
        const material = new THREE.LineBasicMaterial({ color: 0x00ff00 }); // Green edges
        const line = new THREE.Line(geometry, material);
        scene.add(line);
        lines.push(line);
    }
}

function completePolygon() {
    if (vertices.length < 3) return;
    isComplete = true;
    if (polygon) polygon.removeFromScene(scene);
    polygon = new Polygon(vertices);
    polygon.addToScene(scene);
    drawVertices();
}

function copyPolygon() {
    if (!isComplete || !polygon) return;
    movingCopy = polygon.clone();
    movingCopy.addToScene(scene);
    isMovingCopy = true;
}

function resetScene() {
    vertices = [];
    isComplete = false;
    if (polygon) {
        polygon.removeFromScene(scene);
        polygon = null;
    }
    copiedPolygons.forEach(poly => poly.removeFromScene(scene));
    copiedPolygons = [];
    lines.forEach(line => scene.remove(line));
    lines = [];
    if (movingCopy) {
        movingCopy.removeFromScene(scene);
        movingCopy = null;
        isMovingCopy = false;
    }
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

init();
