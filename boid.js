class Boid
{
    

    constructor(id, x, y, 
                vx, vy, max_speed, min_speed,
                avoid, avoid_range, 
                match, vision_range, 
                center, 
                turn, bound_x, bound_y,
                dodge
            )
    {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;

        this.max_speed = max_speed;
        this.min_speed = min_speed;

        this.avoid = avoid;
        this.avoid_range = avoid_range;

        this.match = match;
        this.center = center;
        this.vision_range = vision_range;

        this.turn = turn;
        this.bound_x = bound_x;
        this.bound_y = bound_y;

        this.dodge = dodge;

        this.id = id;

        this.avoid_vec = {dx: 0.0, dy: 0.0};
        this.close_boid = {
                            x: 0.0, y: 0.0, 
                            vx: 0.0, vy: 0.0,
                            count: 0
                        };
        this.predator = {dx: 0.0, dy: 0.0};

    }

    set_bias(max_bias, bias_val, bias_increment, bias_left)
    {
        this.max_bias = max_bias;
        this.bias_val = bias_val;
        this.bias_increment = bias_increment;
        this.bias_left = bias_left;
    }

    observe(others, predator)
    {
        this.avoid_vec = {dx: 0.0, dy: 0.0};
        this.close_boid = {
                            x: 0.0, y: 0.0, 
                            vx: 0.0, vy: 0.0,
                            count: 0
                        };
        this.predator = {dx: 0.0, dy: 0.0};

        for( var i = 0; i < others.length; i += 1 )
        {
            var b = others[i];
            if (b.id == this.id)
            {
                continue;
            }
            const dis = Math.sqrt(Math.pow(b.x-this.x,2) + Math.pow(b.y-this.y,2));
            if (dis <= this.avoid_range)
            {
                this.avoid_vec.dx += this.x - b.x;
                this.avoid_vec.dy += this.y - b.y;
            }
            else if (dis <= this.vision_range)
            {
                this.close_boid.x += b.x;
                this.close_boid.y += b.y;
                this.close_boid.vx += b.vx;
                this.close_boid.vy += b.vy;

                this.close_boid.count += 1;
            }
        }

        const dis = Math.sqrt(Math.pow(predator.x-this.x,2) + Math.pow(predator.y-this.y,2));

        // if (dis <= this.avoid_range * 3.)
        var pred_range = this.vision_range * 2;
        if (dis <= pred_range)
        {
            this.predator.dx = this.x - predator.x;
            this.predator.dy = this.y - predator.y;
            const norm = Math.sqrt( Math.pow(this.predator.dx,2) + Math.pow(this.predator.dy,2) );
            if (norm == 0)
            {
                return;
            }
            var adjust = pred_range - norm;

            this.predator.dx *= adjust / norm;
            this.predator.dy *= adjust / norm;
        }

    }

    update(dt)
    {
        const avg_boid = {
                            x: 0.0, y: 0.0, 
                            vx: 0.0, vy: 0.0,
                            count: 0
                        };

        if (this.close_boid.count > 0)
        {
            avg_boid.x  += this.close_boid.x  / this.close_boid.count;
            avg_boid.y  += this.close_boid.y  / this.close_boid.count;
            avg_boid.vx += this.close_boid.vx / this.close_boid.count;
            avg_boid.vy += this.close_boid.vy / this.close_boid.count;

            this.vx += dt * ( (avg_boid.x - this.x) * this.center + 
                        (avg_boid.vx - this.vx) * this.match );
            this.vy += dt * ( (avg_boid.y - this.y) * this.center +
                        (avg_boid.vy - this.vy) * this.match );
        }
        this.vx += this.avoid_vec.dx * this.avoid * dt;
        this.vy += this.avoid_vec.dy * this.avoid * dt;
        // console.log(this.avoid_vec.dx, this.avoid_vec.dy);

        if (this.predator.dx != 0 && this.predator.dy != 0)
        {
            var pred_norm = this.predator.dx*this.predator.dx + this.predator.dy*this.predator.dy;
            // console.log(pred_norm);
            this.vx += this.predator.dx * this.dodge * dt;
            this.vy += this.predator.dy * this.dodge * dt;
        }

        if (this.x < this.bound_x[0])
        {
            this.vx += this.turn * dt;
        }
        if (this.x > this.bound_x[1])
        {
            this.vx -= this.turn * dt;
        }

        if (this.y < this.bound_y[0])
        {
            this.vy += this.turn * dt;
        }
        if (this.y > this.bound_y[1])
        {
            this.vy -= this.turn * dt;
        }

        const cur_speed = Math.sqrt(this.vx*this.vx + this.vy*this.vy);

        if (cur_speed > this.max_speed)
        {
            this.vx *= this.max_speed / cur_speed;
            this.vy *= this.max_speed / cur_speed;
        }
        else if (cur_speed < this.min_speed)
        {
            this.vx *= this.min_speed / cur_speed;
            this.vy *= this.min_speed / cur_speed;
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;
    }

}

export {Boid};