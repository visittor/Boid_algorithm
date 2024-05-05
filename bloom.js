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

uniform sampler2D u_image;
uniform int u_kernel_r;
uniform float u_horizontal;

out vec4 FragColor;

#define PI radians(180.0)

void main()
{
    // FragColor = texture(u_image, v_textCoord);

    vec2 onePix = vec2(1) / vec2(textureSize(u_image, 0));

    int row = u_kernel_r * 2;
    vec4 sum = vec4(0);
    float sum_f = 0.;

    for(float i = -float(u_kernel_r); i < float(u_kernel_r); i++)
    {
        for(float j = -float(u_kernel_r); j <= float(u_kernel_r); j++)
        {
            float f = exp(-(i*i + j*j) / 2.) / (2.*PI);
            sum += texture(u_image, v_textCoord + onePix*vec2(i,j)) * f;
            sum_f += f;
        }
    }

    FragColor = sum / sum_f;
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

function setUniform(gl, kernelR, horizontal)
{
    const resolutionLocation = gl.getUniformLocation(programInfo.program, "u_resolution");
    const imageLocation = gl.getUniformLocation(programInfo.program, "u_image");
    const kernelRLocation = gl.getUniformLocation(programInfo.program, "u_kernel_r");
    const horizontalLocation = gl.getUniformLocation(programInfo.program, "u_horizontal");

    gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
    gl.uniform1i(imageLocation, 0);
    gl.uniform1i(kernelRLocation, kernelR);
    gl.uniform1f(horizontalLocation, horizontal);
}

function bloomEffect(gl, fbo, pingpongTextures, kernelR)
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
    
    gl.viewport(0, 0, pingpongTextures.getWidth(), pingpongTextures.getHeight());
    gl.bindBuffer(gl.ARRAY_BUFFER, programInfo.positionBuffer);

    setUniform(gl, kernelR, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.flush();
    pingpongTextures.swap();

    // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // setUniform(gl, kernelR, 1);
    // gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    // pingpongTextures.swap();

    gl.bindVertexArray(null);

    gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        null,
        0,
    );

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

export {bloomEffect};