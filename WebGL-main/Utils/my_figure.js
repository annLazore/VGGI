const { cos, sin, sqrt, pow, PI } = Math

function CreateSurfaceDataWithIndices(stepsU = 30, stepsV = 30) {
    const vertices = [];
    const indices = [];
    let normals = [];
    const du = Math.PI * 2 / stepsU;
    const dv = 5 / stepsV;

    for (let u = 0; u <= stepsU; u++) {
        for (let v = 0; v <= stepsV; v++) {
            const vertex = ConicalEdgeVertex(v * dv, u * du);
            vertices.push(...vertex);

            // Compute analytical normals
            const normal = ConicalEdgeNormal(v * dv, u * du);
            normals.push(...normal);

            if (u < stepsU && v < stepsV) {
                const base = u * (stepsV + 1) + v;
                indices.push(base, base + 1, base + stepsV + 1);
                indices.push(base + stepsV + 1, base + 1, base + stepsV + 2);
            }
        }
    }

    console.log(normals)
    console.log(vertices)

    return { vertices, indices, normals };
}


// Example of ConicalEdgeVertex function (replace with your actual implementation)
function ConicalEdgeVertex(v, u) {
    const x = Math.cos(u) * (1 + 0.5 * v);
    const y = Math.sin(u) * (1 + 0.5 * v);
    const z = v;
    return [x, y, z];
}

function ConicalEdgeNormal(v, u) {
    // Partial derivatives of the surface
    const dx_du = -Math.sin(u) * (1 + 0.5 * v);
    const dy_du = Math.cos(u) * (1 + 0.5 * v);
    const dz_du = 0;

    const dx_dv = 0.5 * Math.cos(u);
    const dy_dv = 0.5 * Math.sin(u);
    const dz_dv = 1;

    // Compute the cross product of the partial derivatives
    const normal = crossProduct(
        [dx_du, dy_du, dz_du],
        [dx_dv, dy_dv, dz_dv]
    );

    // Normalize the normal vector
    return normalize(normal);
}

function crossProduct(a, b) {
    return [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0]
    ];
}

function normalize(vector) {
    const length = Math.sqrt(vector[0]**2 + vector[1]**2 + vector[2]**2);
    return length === 0 ? [0, 0, 0] : vector.map(val => val / length);
}

function Model(name) {
    this.name = name;
    this.uBuffers = [];
    this.vBuffers = [];
    this.counts = [];

    this.BufferData = function(vertices, indices, normals) {
        // Validate lengths
        if (vertices.length <= 0 || indices.length <= 0) {
            console.error("Vertices or indices array is empty.");
            return;
        }
    
        // Create and bind the vertex buffer
        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);
    
        // Create and bind the index buffer
        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STREAM_DRAW);
    
        // Normal
        this.normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STREAM_DRAW);

        this.vertexCount = indices.length;
    };
    
    this.Draw = function() {
        // Bind the vertex buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        if (shProgram.iAttribVertex >= 0) {
            gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(shProgram.iAttribVertex);
        }
    
        // Bind the normal buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        if (shProgram.iAttribNormal >= 0) {
            gl.vertexAttribPointer(shProgram.iAttribNormal, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(shProgram.iAttribNormal);
        }
    
        // Bind the index buffer
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    
        // Draw the indexed geometry
        gl.drawElements(gl.TRIANGLES, this.vertexCount, gl.UNSIGNED_SHORT, 0);
    };
    
    
}

function initGL() {
    let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);

    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();

    shProgram.iAttribVertex = gl.getAttribLocation(prog, "vertex");
    shProgram.iAttribNormal = gl.getAttribLocation(prog, "normal");
    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    shProgram.lightPositionLocation = gl.getUniformLocation(prog, 'light_position');
    shProgram.cameraPositionLocation = gl.getUniformLocation(prog, 'camera_position');
    shProgram.iColor = gl.getUniformLocation(prog, 'baseColor');

    shProgram.modelMatrixLocation = gl.getUniformLocation(prog, 'ModelMatrix');

    // Create surface model and buffer data
    surface = new Model('Surface');
    const { vertices, indices, normals } = CreateSurfaceDataWithIndices();
    surface.BufferData(vertices, indices, normals);

    gl.enable(gl.DEPTH_TEST);
}

function updateGranularity() {
    const stepsU = parseInt(document.getElementById('uGranularity').value);
    const stepsV = parseInt(document.getElementById('vGranularity').value);

    // Update the displayed values
    document.getElementById('uValue').textContent = stepsU;
    document.getElementById('vValue').textContent = stepsV;

    // Regenerate surface data with new granularity
    const { vertices, indices, normals } = CreateSurfaceDataWithIndices(stepsU, stepsV);
    surface.BufferData(vertices, indices, normals);

    // Redraw
    draw();
}



function Tangents(t, u) {
    let dXdu = [-t * sin(u), t * cos(u), 0];
    let dXdt = [cos(u), sin(u), c];
    return { dXdu, dXdt };
}

function Normal(t, u) {
    const { dXdu, dXdt } = Tangents(t, u);
    const cross = [
        dXdu[1] * dXdt[2] - dXdu[2] * dXdt[1],
        dXdu[2] * dXdt[0] - dXdu[0] * dXdt[2],
        dXdu[0] * dXdt[1] - dXdu[1] * dXdt[0]
    ];
    const length = Math.sqrt(cross[0]**2 + cross[1]**2 + cross[2]**2);
    return [cross[0] / length, cross[1] / length, cross[2] / length];
}



const a = 1
const b = 3
const c = 1

const scaler = 0.2;


function ConicalEdgeVertex(t, u) {

    let x = t * cos(u),
        y = t * sin(u),
        z = c*(a*a-b*b*cos(u)*cos(u));
    return [scaler * x, scaler * y, scaler * z];
}