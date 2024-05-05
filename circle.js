import { initShader } from "./shaderLoader.js";

const vsSource = `#version 300 es
in float aId;

uniform vec4 uColor;
uniform float uNumVertices;
uniform float uRadius;

uniform mat4 uModelViewMat;
uniform mat4 uProjMat;
out vec4 v_color;

#define PI radians(180.0)

void main()
{
    if (aId < 0.0)
    {
        gl_Position = uProjMat * uModelViewMat * vec4(0,0,1,1);
    }
    else
    {
        float t = 2. * PI * (aId / uNumVertices);
        vec4 pos = vec4(cos(t) * uRadius, sin(t) * uRadius, 1, 1);
        gl_Position = uProjMat * uModelViewMat * pos;
    }
    v_color = uColor;
}
`;

const fsSource = `#version 300 es
precision mediump float;
in vec4 v_color;

uniform int u_ishsv;

out vec4 FragColor;

vec3 rgb2hsv(vec3 c)
{
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsl2rgb(vec3 c)
{
    vec3 rgb = clamp( abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0 );

    return c.z + c.y * (rgb-0.5)*(1.0-abs(2.0*c.z-1.0));
}

vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main()
{
    if (u_ishsv == 1)
    {
        FragColor = vec4(hsv2rgb(v_color.rgb), v_color.a);
    }
    else
    {
        FragColor = v_color;
    }
}
`;

var programInfo = null;

var NUM_POINTS = 100;
const vertexIds = new Float32Array(NUM_POINTS + 2);
vertexIds.forEach((v, i) => { vertexIds[i] = i - 1; });
var idBuffer = null;

function drawCircle(gl, radius, color, modelViewMat, projMat, fill, is_hsv = 0)
{

    if (programInfo === null)
    {
        const shaderProgram = initShader(gl, vsSource, fsSource);
        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);
        
        idBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, idBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertexIds, gl.STATIC_DRAW);
        
        const idLoc = gl.getAttribLocation(shaderProgram, "aId");
        const numComponent = 1;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, idBuffer);
        gl.vertexAttribPointer(
            idLoc,
            numComponent,
            type,
            normalize,
            stride,
            offset
        );
        gl.enableVertexAttribArray(idLoc);
        
        programInfo = {
            program: shaderProgram,
            vao: vao,
            attribLocs: {
                id: gl.getAttribLocation(shaderProgram, "aId"),
            },
            uniformLocs: {
                color: gl.getUniformLocation(shaderProgram, "uColor"),
                numVertices: gl.getUniformLocation(shaderProgram, "uNumVertices"),
                radius: gl.getUniformLocation(shaderProgram, "uRadius"),
                modelViewMat: gl.getUniformLocation(shaderProgram, "uModelViewMat"),
                projMat: gl.getUniformLocation(shaderProgram, "uProjMat"),
                ishsv: gl.getUniformLocation(shaderProgram, "u_ishsv"),
            }
        };
    }

    if (idBuffer === null)
    {
    }

    gl.useProgram(programInfo.program);
    gl.bindVertexArray(programInfo.vao);

    gl.uniformMatrix4fv(
        programInfo.uniformLocs.modelViewMat,
        false,
        modelViewMat,
    );

    gl.uniformMatrix4fv(
        programInfo.uniformLocs.projMat,
        false,
        projMat,
    );

    gl.uniform1f(
        programInfo.uniformLocs.numVertices,
        100.,
    );

    gl.uniform1f(
        programInfo.uniformLocs.radius,
        radius,
    );

    gl.uniform4f(
        programInfo.uniformLocs.color,
        color[0], color[1], color[2], color[3],
    );

    gl.uniform1i(
        programInfo.uniformLocs.ishsv,
        is_hsv,
    )

    if(fill)
    {
        const offset = 0;
        gl.drawArrays(gl.TRIANGLE_FAN, offset, vertexIds.length);
    }
    else
    {
        const offset = 1;
        gl.drawArrays(gl.LINE_LOOP, offset, vertexIds.length - 1);
    }

}

export{drawCircle};