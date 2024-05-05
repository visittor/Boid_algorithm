
function loadShader(gl, type, source){

    const shader = gl.createShader(type);
  
    gl.shaderSource(shader, source);
  
    gl.compileShader(shader);
  
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
      alert(
        `Unable to compile shader program ${gl.getShaderInfoLog(shader)}`
      );
      gl.deleteShader(shader);
      return null;
    }
  
    return shader;
  
  }
  
  function initShader( gl, vsSource, fsSource ){
  
    const vsShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fsShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vsShader);
    gl.attachShader(shaderProgram, fsShader);
    gl.linkProgram(shaderProgram);
    gl.validateProgram(shaderProgram);
  
    if(!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)){
      alert(`Unable to initialize shader program ${gl.getProgramInfoLog(shaderProgram)}`);
      return null;
    }
  
    return shaderProgram;
  
  }

  export{initShader};