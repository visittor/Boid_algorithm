import { initShader } from "./shaderLoader.js";

function createRGBATexture(gl, width, height)
{
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    return texture;
}

class PingPongTextures
{

    #vsSource = `#version 300 es
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

    #fsSource = `#version 300 es
    precision mediump float;
    in vec2 v_textCoord;

    uniform sampler2D u_image;

    out vec4 FragColor;
    void main()
    {
        FragColor = texture(u_image, v_textCoord);

        // vec2 onePix = vec2(1) / vec2(textureSize(u_image, 0));
        // vec4 c_sum = 
        //     texture(u_image, v_textCoord + onePix*vec2(-2,-2)) * 1. +
        //     texture(u_image, v_textCoord + onePix*vec2(-1,-2)) * 4. +
        //     texture(u_image, v_textCoord + onePix*vec2( 0,-2)) * 7. +
        //     texture(u_image, v_textCoord + onePix*vec2( 1,-2)) * 4. +
        //     texture(u_image, v_textCoord + onePix*vec2( 2,-2)) * 1. +
    
        //     texture(u_image, v_textCoord + onePix*vec2(-1,-1)) *  4. +
        //     texture(u_image, v_textCoord + onePix*vec2(-2,-1)) * 20. +
        //     texture(u_image, v_textCoord + onePix*vec2( 0,-1)) * 33. +
        //     texture(u_image, v_textCoord + onePix*vec2( 1,-1)) * 20. +
        //     texture(u_image, v_textCoord + onePix*vec2( 2,-1)) *  4. +
    
        //     texture(u_image, v_textCoord + onePix*vec2(-2, 0)) *  7. +
        //     texture(u_image, v_textCoord + onePix*vec2(-1, 0)) * 33. +
        //     texture(u_image, v_textCoord + onePix*vec2( 0, 0)) * 55. +
        //     texture(u_image, v_textCoord + onePix*vec2( 1, 0)) * 33. +
        //     texture(u_image, v_textCoord + onePix*vec2( 2, 0)) *  7. +

        //     texture(u_image, v_textCoord + onePix*vec2(-2, 1)) *  4. +
        //     texture(u_image, v_textCoord + onePix*vec2(-1, 1)) * 20. +
        //     texture(u_image, v_textCoord + onePix*vec2( 0, 1)) * 33. +
        //     texture(u_image, v_textCoord + onePix*vec2( 1, 1)) * 20. +
        //     texture(u_image, v_textCoord + onePix*vec2( 2, 1)) *  4. +

        //     texture(u_image, v_textCoord + onePix*vec2(-2, 2)) * 1. +
        //     texture(u_image, v_textCoord + onePix*vec2(-1, 2)) * 4. +
        //     texture(u_image, v_textCoord + onePix*vec2( 0, 2)) * 7. +
        //     texture(u_image, v_textCoord + onePix*vec2( 1, 2)) * 4. +
        //     texture(u_image, v_textCoord + onePix*vec2( 2, 2)) * 1.;
    
        // c_sum /= 331.;
        // FragColor = FragColor + c_sum;
    }
    `;

    #width = 0;
    #height = 0;
    #textures = []
    #readIdx = 0;

    constructor(gl, width, height)
    {
        this.gl = gl;
        this.#width = width;
        this.#height = height;

        this.#textures.push(this.#createTexture());
        this.#textures.push(this.#createTexture());

        const program = initShader(gl, this.#vsSource, this.#fsSource);

        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        const positionLoc = gl.getAttribLocation(program, "a_position");
        const posBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
        const position = [    0,0, 
                        0,gl.canvas.height, 
                        gl.canvas.width,0, 
                        gl.canvas.width, gl.canvas.height 
                    ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(position), gl.STATIC_DRAW);
        gl.vertexAttribPointer(
            positionLoc, // location
            2, // num components
            gl.FLOAT, // type
            false, // normalize
            0, // stride
            0, // offset
        );
        gl.enableVertexAttribArray(positionLoc);

        this.programInfo = {
            program: program,
            vao: vao,
            positionBuffer: posBuffer,
        };

    }

    getHeight()
    {
        return this.#height;
    }

    getWidth()
    {
        return this.#width;
    }

    #createTexture()
    {
        var texture = createRGBATexture(this.gl, this.#width, this.#height);

        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        var mipLevel = 0;               // the largest mip
        var internalFormat = this.gl.RGBA32F;   // format we want in the texture
        var border = 0;                 // must be 0
        var srcFormat = this.gl.RGBA;        // format of data we are supplying
        var srcType = this.gl.FLOAT  // type of data we are supplying
        var data = null;                // no data = create a blank texture
        this.gl.texImage2D(
                        this.gl.TEXTURE_2D, 
                        mipLevel, 
                        internalFormat, 
                        this.#width, this.#height, 
                        border, 
                        srcFormat, srcType, 
                        data);

        return texture;
    }

    getReadTexture()
    {
        return this.#textures[this.#readIdx];
    }

    getWriteTexture()
    {
        return this.#textures[1 - this.#readIdx];
    }

    swap()
    {
        this.#readIdx = (this.#readIdx + 1) % 2;
    }

    renderTexture()
    {
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
        this.gl.activeTexture(this.gl.TEXTURE0 + 0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.getReadTexture());

        this.gl.useProgram(this.programInfo.program);
        this.gl.bindVertexArray(this.programInfo.vao);

        const resolutionLocation = this.gl.getUniformLocation(
                                                    this.programInfo.program, 
                                                    "u_resolution"
                                                );
        const imageLocation = this.gl.getUniformLocation(
                                                    this.programInfo.program, 
                                                    "u_image"
                                                );

        this.gl.uniform2f(resolutionLocation, this.gl.canvas.width, this.gl.canvas.height);
        this.gl.uniform1i(imageLocation, 0);


        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.programInfo.positionBuffer);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }

}

export {PingPongTextures};