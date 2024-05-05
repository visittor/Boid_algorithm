import { initShader } from "./shaderLoader.js";

const vsSource=`#version 300 es

in vec2 a_position;

uniform vec2 u_resolution;

out vec2 v_textCoord;

void main()
{
    vec2 zero2one = a_position / u_resolution;
    gl_Position = vec4(2.*zero2one - 1., 0, 1);
    v_textCoord = zero2one;
}
`;

const fsSource=`#version 300 es
precision highp float;
in vec2 v_textCoord;

uniform float u_alpha;
uniform sampler2D u_image;

out vec4 FragColor;

void main()
{
    FragColor = texture(u_image, v_textCoord);
    FragColor = mix(vec4(0,0,0,0), vec4(FragColor.rgb, u_alpha), step(0.1,FragColor.a));
    // if (FragColor.a < 0.01)
    // {
    //     FragColor = vec4(0, 0, 0, 0);
    // }
    // else
    // {
    //     FragColor.a = u_alpha;
    // }
}
`;

var programInfo = null;

function initEffectShader(gl)
{
    const program = initShader(gl, vsSource, fsSource);

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    var positionLocation = gl.getAttribLocation(program, "a_position");

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const position = [  0,0, 
                        0,gl.canvas.height*2, 
                        gl.canvas.width*2,0, 
                        gl.canvas.width*2,gl.canvas.height*2 
                    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(position), gl.STATIC_DRAW);
    gl.vertexAttribPointer(
        positionLocation, // location
        2, // num components
        gl.FLOAT, // type
        false, // normalize
        0, // stride
        0, // offset
    );
    gl.enableVertexAttribArray(positionLocation);

    programInfo = {
        program: program,
        vao: vao,
        positionBuffer: positionBuffer,
    };
}

function setUniform(gl, alpha)
{
    const resolutionLocation = gl.getUniformLocation(programInfo.program, "u_resolution");
    const alphaLocation = gl.getUniformLocation(programInfo.program, "u_alpha");
    const imageLocation = gl.getUniformLocation(programInfo.program, "u_image");

    gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
    gl.uniform1f(alphaLocation, alpha);
    gl.uniform1i(imageLocation, 0);
}

function applyEffect(gl, fbo, pingpongTextures, alpha, drawFunc)
{

    if (programInfo === null)
    {
        initEffectShader(gl);
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        pingpongTextures.getWriteTexture(),
        0,
    );
    
    gl.clearColor(.0, .0, 0., 0.);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    gl.activeTexture(gl.TEXTURE0 + 0);
    gl.bindTexture(gl.TEXTURE_2D, pingpongTextures.getReadTexture());
    
    gl.useProgram(programInfo.program);
    gl.bindVertexArray(programInfo.vao);
    setUniform(gl, alpha);
    
    // gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    // gl.viewport(0, 0, gl.canvas.width * 2, gl.canvas.height * 2);
    // console.log(gl.canvas.width, pingpongTextures.getWidth());
    gl.viewport(0, 0, pingpongTextures.getWidth(), pingpongTextures.getHeight());
    gl.bindBuffer(gl.ARRAY_BUFFER, programInfo.positionBuffer);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindVertexArray(null);
    gl.flush();

    drawFunc();

    pingpongTextures.swap();

    gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        null,
        0,
    );

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

export {applyEffect};