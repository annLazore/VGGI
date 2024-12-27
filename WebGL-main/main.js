'use strict';

let gl;                         // The webgl context.
let surface;                    // A surface model
let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.
let normalTexture; // Оголошуємо змінну глобально
let diffuseTexture;
let roughnessTexture;
let rotationAngle = 0; // Rotation angle in degrees
let rotationPoint = { u: 0.5, v: 0.5 }; // Initial rotation point in (u, v) space


function deg2rad(angle) {
    return angle * Math.PI / 180;
}


// Constructor
function ShaderProgram(name, program) {

    this.name = name;
    this.prog = program;
    this.iAttribVertex = -1;
    this.iAttribNormal = -1;
    this.iColor = -1;
    this.iModelViewProjectionMatrix = -1;

    this.Use = function() {
        gl.useProgram(this.prog);
    }
}


/* Draws a colored cube, along with a set of coordinate axes.
 * (Note that the use of the above drawPrimitive function is not an efficient
 * way to draw with WebGL.  Here, the geometry is so simple that it doesn't matter.)
 */
let time = 0; // Глобальна змінна для часу
let lastTimestamp = 0; // Час останнього оновлення

function updateLightPosition(deltaTime) {
    // Розраховуємо нову позицію світла
    // const radius = 100.0;
    // const speed = 1.0;
    // time += deltaTime * speed;
    // return [
    //     radius * Math.cos(time),       // X
    //     5.0  ,    // Y обертається з амплітудою
    //     radius * Math.sin(time)        // Z
    // ];
    return [55.0, 50.0, 54.0];
}

function render(timestamp) {
    // Розрахунок часу між кадрами
    const deltaTime = (timestamp - lastTimestamp) / 1000; // У секундах
    lastTimestamp = timestamp;

    // Оновлюємо положення світла
    const lightPosition = updateLightPosition(deltaTime);

    // Передаємо позицію світла у шейдер
    gl.uniform3fv(shProgram.lightPositionLocation, lightPosition);
    gl.uniform3fv(shProgram.cameraPositionLocation, [0, 0, 10]); // Камера над об'єктом
    gl.uniform4fv(shProgram.iColor, [0.5, 0.1, 1.0, 1.0]); // Базовий колір об'єкта


    // Малюємо сцену
    draw();

    // Наступний кадр
    requestAnimationFrame(render);
}

function draw() {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Diffuse texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, diffuseTexture);
    gl.uniform1i(shProgram.diffuseTextureLocation, 0);

    // Normal texture
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, normalTexture);
    gl.uniform1i(shProgram.normalTextureLocation, 1);

    // Roughness texture
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, roughnessTexture);
    gl.uniform1i(shProgram.roughnessTextureLocation, 2);

    // Отримуємо трансформаційні матриці
    const projection = m4.perspective(Math.PI / 8, 1, 8, 12);
    const modelView = spaceball.getViewMatrix();

    let rotateToPointZero = m4.axisRotation([0.707, 0.707, 0], 0.7);
    let translateToPointZero = m4.translation(0, 0, -10);

    let matAccum0 = m4.multiply(rotateToPointZero, modelView);
    let matAccum1 = m4.multiply(translateToPointZero, matAccum0);
    let modelViewProjection = m4.multiply(projection, matAccum1);

    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);

    const modelMatrix = m4.identity();
    m4.multiply(modelView, matAccum1, modelMatrix);
    m4.inverse(modelMatrix, modelMatrix);
    m4.transpose(modelMatrix, modelMatrix);
    gl.uniformMatrix4fv(shProgram.modelMatrixLocation, false, modelMatrix);

    gl.uniform2fv(shProgram.rotationPointLocation, [rotationPoint.u, rotationPoint.v]);
    gl.uniform1f(shProgram.rotationAngleLocation, rotationAngle * Math.PI / 180);


    // Передаємо текстурні координати
    if (shProgram.iTexCoord >= 0) {
        gl.bindBuffer(gl.ARRAY_BUFFER, surface.texCoordBuffer);
        gl.vertexAttribPointer(shProgram.iTexCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iTexCoord);
    }

    surface.Draw();
    drawRotationSphere();
}



function createProgram(gl, vShader, fShader) {
    let vsh = gl.createShader( gl.VERTEX_SHADER );
    gl.shaderSource(vsh,vShader);
    gl.compileShader(vsh);
    if ( ! gl.getShaderParameter(vsh, gl.COMPILE_STATUS) ) {
        throw new Error("Error in vertex shader:  " + gl.getShaderInfoLog(vsh));
     }
    let fsh = gl.createShader( gl.FRAGMENT_SHADER );
    gl.shaderSource(fsh, fShader);
    gl.compileShader(fsh);
    if ( ! gl.getShaderParameter(fsh, gl.COMPILE_STATUS) ) {
       throw new Error("Error in fragment shader:  " + gl.getShaderInfoLog(fsh));
    }
    let prog = gl.createProgram();
    gl.attachShader(prog,vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if ( ! gl.getProgramParameter( prog, gl.LINK_STATUS) ) {
       throw new Error("Link error in program:  " + gl.getProgramInfoLog(prog));
    }
    return prog;
}

window.onkeydown = (e) => {
    const step = 0.05; // Increment for moving the rotation point
    if (e.keyCode == 87) { //w
            rotationPoint.v = rotationPoint.v + step;
        }
    else if (e.keyCode == 83) { //s
            rotationPoint.v = rotationPoint.v - step;
    }
    else if (e.keyCode == 65) { //a
            rotationPoint.u = rotationPoint.u - step;
        }
    else if (e.keyCode == 68) { //d
            rotationPoint.u = rotationPoint.u + step;
            
    }
    document.getElementById('rotationPoint').textContent = `(${rotationPoint.u.toFixed(2)}, ${rotationPoint.v.toFixed(2)})`;
};



function init() {
    let canvas;
    try {
        canvas = document.getElementById("webglcanvas");
        gl = canvas.getContext("webgl");
        if ( ! gl ) {
            throw "Browser does not support WebGL";
        }
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }
    try {
        initGL();  // initialize the WebGL graphics context
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
        return;
    }

    spaceball = new TrackballRotator(canvas, draw, 0);

    document.getElementById('uGranularity').addEventListener('input', updateGranularity);
    document.getElementById('vGranularity').addEventListener('input', updateGranularity);

    document.getElementById('rotationAngle').addEventListener('input', (event) => {
        rotationAngle = parseFloat(event.target.value);
        document.getElementById('angleValue').textContent = rotationAngle.toFixed(0);
    });
    


    // draw();
    requestAnimationFrame(render);
}