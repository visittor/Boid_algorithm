import { initShader } from "./shaderLoader.js";
import { drawCircle } from "./circle.js";
import { PingPongTextures } from "./textures.js"
import { applyEffect } from "./applyEffect.js";
import { bloomEffect } from "./bloom.js";
import { Boid } from "./boid.js";


main();

function main()
{
    const canvas = document.getElementById("glcanvas");
    if (canvas === null)
    {
        alert("WTF");
    }

    const gl = canvas.getContext("webgl2");

    // Only continue if WebGL is available and working
    if (gl === null) {
        alert(
          "Unable to initialize WebGL. Your browser or machine may not support it.",
        );
      return;
    }

    const boids = [];

    const MAX_SPEED = 6; // across screen in 8 sec
    const MIN_SPEED = 3; // across screen in 10 sec
    const AVOID = 0.08;
    const AVOID_RANGE = 8; //  slightly larger than max speed
    const MATCH = 0.09;
    const CENTER = 0.0005;
    const VISION_RANGE = 40;
    const TURN = 0.2;
    const BOUND_X = [-300, 300];
    const BOUND_Y = [-100, 100];
    const MAX_BIAS = 0.01;
    const BIAS_VAL = 0.001;
    const BIAS_INC = 0.00004;
    const NUM_BIAS = 0;

    const DODGE = 1.;
    // const DODGE = 0;

    const predator = new Boid( 
                              -1, 
                              // 400 * Math.random() - 200, 400 * Math.random() - 200,
                              -1000000, -1000000,
                              80 * Math.random() - 80, 80 * Math.random() - 40,
                              MAX_SPEED * 2., MAX_SPEED * 2 * 0.1,
                              0, AVOID_RANGE,
                              0, VISION_RANGE / 1,
                              CENTER * 3,
                              TURN,
                              BOUND_X, BOUND_Y,
                              0,
                            );

    for(var i = 0; i < 300; i++)
    {
      var b = new Boid( 
                    i, 
                    400 * Math.random() - 200, 400 * Math.random() - 200,
                    10 * Math.random() - 5, 10 * Math.random() - 5,
                    MAX_SPEED, MIN_SPEED,
                    AVOID, AVOID_RANGE,
                    MATCH, VISION_RANGE,
                    CENTER,
                    TURN,
                    BOUND_X, BOUND_Y,
                    DODGE,
                  );
      boids.push(b);
    }

    const avoid_input = document.getElementById("avoid");
    avoid_input.addEventListener( "change", (e) =>{
      console.log(e.target.value);
      boids.forEach((v,i)=>{
        v.avoid = e.target.value;
      });

    } );

    const matching_input = document.getElementById("matching");
    matching_input.addEventListener( "change", (e)=>{
      boids.forEach((v,i)=>{
        v.match = e.target.value;
      });
    });

    const center_input = document.getElementById("center");
    center_input.addEventListener("change", (e)=>{
      boids.forEach((v,i)=>{
        v.center = e.target.value;
      });
    });

    let have_predator = false;
    const pred_input = document.getElementById("predator");
    pred_input.addEventListener("change", (e)=>{
      have_predator = e.target.checked;
      console.log(e.target.checked);
      if(!have_predator)
      {
        predator.x = -1000000;
        predator.y = -1000000;
        predator.vx = 0.0;
        predator.vy = 0.0;
      }
      else
      {
        predator.x = 0;
        predator.y = 0;
        predator.vx = 80 * Math.random() - 80;
        predator.vy = 80 * Math.random() - 40;
      }
    });

    let then = 0;
    let dt = 0;
    let rotation = 0;
    
    const ext = gl.getExtension("EXT_color_buffer_float");
    const fbo = gl.createFramebuffer();
    const pingpongTextures = new PingPongTextures(gl, gl.canvas.width*2, gl.canvas.height*2);
    const pingpongTextures_2 = new PingPongTextures(gl, gl.canvas.width, gl.canvas.height);


    gl.clearColor(0., 0., 0., 1.);
    gl.clearDepth(1.);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.enable(gl.BLEND);
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var draw = false

    function render(now)
    {
        now *= 0.001;
        dt = now - then;
        dt = Math.min(1., dt);
        // console.log(dt);
        // dt = 0.025; 
        dt *= 25;
        // dt = 0.5;
        then = now;
        
        if(have_predator)
        {
          predator.observe(boids, predator);
          predator.update(dt);
        }

        boids.forEach( (b, i) =>{
          b.observe(boids, predator);
        } );
        boids.forEach( (b, i) =>{
          b.update(dt);
        } );

        const projMat = mat4.create();
        const left = (-gl.canvas.clientWidth / 2);
        const right = (gl.canvas.clientWidth / 2);
        const top = (-gl.canvas.clientHeight / 2);
        const bot = ( gl.canvas.clientHeight / 2);
        mat4.ortho(projMat, left, right, top, bot, 0.01, 100);

        const viewMat = mat4.create();
        mat4.translate(viewMat, viewMat, [0., 0., -6.]);

        applyEffect(gl, fbo, pingpongTextures, 0.83, function(){

          boids.forEach( (b, i) =>{

            const modelMat = mat4.create();
            mat4.translate(modelMat, modelMat, [b.x, b.y, 0]);

            const mvMat = mat4.create();
            mat4.mul(mvMat, viewMat, modelMat);
            
            const dis2pred = Math.sqrt(Math.pow(b.x - predator.x, 2) + Math.pow(b.y - predator.y, 2));
            var brigthness;
            const min_bright = 0.2;
            if (dis2pred <= VISION_RANGE * 2.)
            {
              brigthness = Math.max((VISION_RANGE * 2. - dis2pred) / VISION_RANGE * 2., min_bright);
            }
            else
            {
              brigthness = min_bright;
            }
            // brigthness = min_bright;

            drawCircle(gl, 3, [2/3,0.6,brigthness,1], mvMat, projMat, true, 1);

          } )

          // const modelMat = mat4.create();
          // mat4.translate(modelMat, modelMat, [predator.x, predator.y, 0]);

          // const mvMat = mat4.create();
          // mat4.mul(mvMat, viewMat, modelMat);

          // drawCircle(gl, 6, [0/3,0.9,1,1], mvMat, projMat, true, 1);

          gl.flush();
        });

        // bloomEffect(gl, fbo, pingpongTextures, 3);

        applyEffect(gl, fbo, pingpongTextures_2, 0.92, function(){
          const modelMat = mat4.create();
          mat4.translate(modelMat, modelMat, [predator.x, predator.y, 0]);

          const mvMat = mat4.create();
          mat4.mul(mvMat, viewMat, modelMat);

          drawCircle(gl, 5, [0/3,0.8,1,1], mvMat, projMat, true, 1);
          gl.flush();
        });

        gl.clearColor(0., 0., 0., 1.);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        pingpongTextures.renderTexture();
        pingpongTextures_2.renderTexture();

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

}