function threeD(renderer, subscriber) {
  const FPS = 10000/2499 // frames per second (NTSC, just for the hell of it)
  const [TX, TY, TZ] = [.001, .002, .003] // how many radians to rotate per frame, per axis

  var clipping = true
  var perspective = true

  function Matrix(tx, ty, tz) {
    const C = Math.cos, S = Math.sin  // lazy programmer doesn't like to type

    tx ||= 0, ty ||= 0, tz ||= 0 // missing values are assumed to be 0

    var state = multiply(
      multiply([ // x-axis
        [1, 0, 0],
        [0, C(tx), S(tx)],
        [0, -S(tx), C(tx)]
      ],
      [ // y-axis
        [C(ty), 0, S(ty)],
        [0, 1, 0],
        [-S(ty), 0, C(ty)]
      ]),
      [ // z-axis
        [C(tz), S(tz), 0],
        [-S(tz), C(tz), 0],
        [0, 0, 1]
    ])

    function multiply(A, B) {
      var m = A.length
      var n = A[0].length
      var p = B[0].length
      if (B.length != n)
        throw "bad dimensions: A[" + m + "," + n + "] and B[" + B.length + ", " + p + "]";
      var rowA, colA, colB, i, result = [...(new Array(m))].map(el => new Array(p).fill(0))

      // the gruesome details of this operation are here: https://en.wikipedia.org/wiki/Matrix_multiplication
      // it looks a lot nicer in math than it does in programming, although this couldn't be much simpler
      for (rowA = 0; rowA < m; rowA++)
        for (colB = 0; colB < p; colB++)
          for (i = 0; i < n; i++)
            result[rowA][colB] += A[rowA][i] * B[i][colB]

      return result
    }

    this.transform = function(multiplier) {
      if (!(multiplier instanceof Matrix))
        throw "expecting type Matrix for multiplier, got: " + typeof multiplier + ", " + multiplier
      return new Matrix().setState(multiply(state, multiplier.getState()))
    }

    // like the additive inverse in math: `m1.transform(m2).transform(m2.inverse()) == m1`; at least i hope it does
    this.inverse = function() {
      var rows = state.length
      if (rows < 0)
        throw "state is empty"
      var cols = state[0].length
      if (rows != cols)
        throw "state is not square", state
      var row, col
      var result = new Matrix()
      resultState = result.getState()
      for (row = 0; row < rows; row++) {
        for (col = 0; col < cols; col++) {
          resultState[i][j] = state[j][i] // this is why i didn't want Matrix.getState(), but now i need it
        }
      }
      return result
    }

    //
    // BEGIN: helper functions that aren't worth paying attention to
    //
    this.getState = function() {
      return state
    }

    this.setState = function(s) { // this is so wrong, but it makes Vector*Matrix trivial
      state = s
      return this
    }

    // toVector returns a single column from a matrix as a vector
    this.toVector = function(axis) {
      var axis = axis || 0 // dunno why it wouldn't be 0, but maybe you have reasons
      return new Vector(state[axis][0], state[axis][1], state[axis][2])
    }

    this.pub = function(sub) {
      sub("matrix", state)
      return this
    }
    //
    // END: helper functions that aren't worth paying attention to
    //
  }

  function Vector(x, y, z) {  // a real unit vector is an anon inner class in the method `unit()`
    x ||= 0, y ||= 0, z ||= 0  // sanity, defaults to 0

    // scale is a cheap way to imply distance; the farther away a thing is on the z-axis, the
    // smaller the scale factor; the thing touching the front of your eyeball should have a
    // scale of 1
    this.scale = function(factor) {
      if (typeof factor !== "number")
        throw "expecting type number for factor, got: " + typeof factor;
      return new Vector(x * factor, y * factor, z * factor)
    }

    // translate means i know where i am in absolute coords, and i know how far
    // away you are relative to me, so i can figure out your absolute coords; the
    // inverse would take two coords and return the vector between them
    this.translate = function(delta) {
      if (!(delta instanceof Vector))
        throw "expecting type Vector for delta, got: " + typeof delta;
      return new Vector(x + delta.getX(), y + delta.getY(), z + delta.getZ())
    }

    // transform is where the magic happens; you'll know that you've arrived when you
    // see that the shape never moves - your head's moving inside of it
    this.transform = function(multiplier) {
      return new Matrix()
        .setState([[x, y, z]]) // vector is just a 1xN matrix, so recycle Matrix multiplication logic
        .transform(multiplier) // it doesn't account for parallax, but that's ok
        .toVector() // that's a mouthful
    }

    //
    // BEGIN: helper functions that aren't worth paying attention to
    //
    this.getX = nil => x
    this.getY = nil => y
    this.getZ = nil => z

    this.unit = function() {
      return new function(l) {
        console.log("wtf2", l)
        var [dx, dy, dz, l] = [x/l, y/l, z/l, l]
        this.scale = function(s) {
          console.log("wtf1", dx, dy, dz, l)
          l *= s
          return this
        }
        this.getX = nil => dx * l
        this.getY = nil => dy * l
        this.getZ = nil => dz * l
        this.getLength = nil => l
        this.vector = function() {
          return new Vector(this.getX(), this.getY(), this.getZ())
        }
      }(Math.sqrt(x*x + y*y + z*z))
    }

    this.parallax =  function() {
      if (!perspective)
        return this
      var factor = (5 + z) / 5
      return new Vector(x * factor, y * factor, z)
    }

    // another additive inverse: `v1.translate(v2).translate(v2.inverse()) == v1`; for convencience
    this.inverse = function() {
      return new Vector(-x, -y, -z)
    }

    this.pub = function(sub) {
      sub(this.toString())
      return this
    }

    this.toString = function() {
      return "x: " + x + ", y: " + y + ", z: " + z
    }
    //
    // END: helper functions that aren't worth paying attention to
    //
  }

  var shape = new function() {
    var tx = 0, ty = 0, tz = 0

    // vertices are just dots that you connect with edges (below); the reference implementation
    // is just a cube, but if you want to do the math, you could make soccer balls, or buckyballs
    // or pirate ships
    var vertices = [
      // the first 4 are the points under the xy plane
      new  Vector(-1, -1, -1),
      new  Vector(-1, 1, -1),
      new  Vector(1, 1, -1),
      new  Vector(1, -1, -1),
      // and the next 4 are the ones above
      new  Vector(-1, -1, 1),
      new  Vector(-1, 1, 1),
      new  Vector(1, 1, 1),
      new  Vector(1, -1, 1)
    ]

    // an edge is just a line between two dots
    var edges = [
      // connect the dots
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 4],
      [0, 4],
      [1, 5],
      [2, 6],
      [3, 7]
      // TODO: connect the diagonals for cash and prizes
    ]

    this.rotate = function(render) {
      var i, j, vertices = xform(new Matrix(tx += TX, ty += TY, tz += TZ))
      for (i = 0, j = edges.length; i < j; i++) {
        var [start, end, ok] = clip(vertices[edges[i][0]], vertices[edges[i][1]])
        if (ok)
          render(start, end)
      }
      return this
    }

    this.pub = function(sub) {
      sub(xform(new Matrix(TX, TY, TZ)))
      return this
    }

    // there are better ways to do real clipping
    function clip(start, end) {
      if (!clipping)
        return [start, end, true]
      if (end.getZ() > start.getZ())  // for our purpose, end should always have smaller z than start
        [start, end] = [end, start]
      if (end.getZ() > 0)  // this means that both points are behind us
        return [null, null, false]
      if (start.getZ() <= 0)  // if both points are in front of us, just draw the line
        return [start, end, true]
      return [
        start.
          translate(end.inverse()). // normalize start using end as the origin
          unit().
          // endZ is negative and startZ isn't, so this is a positive factor
          scale(end.getZ() / (end.getZ() - start.getZ())).
          vector().
          translate(end),
        end,
        true
      ]
    }

    function xform(m) {
      var i, j, result = new Array(vertices.length)
      for (i = 0, j = vertices.length; i < j; i++) {
        result[i] = vertices[i].transform(m).parallax().pub(console.log)
      }
      return result
    }
  }()

  if (!renderer || !renderer.getContext)
    throw "renderer is nil"

  var ctx = renderer.getContext('2d');
  ctx.lineWidth = 5
  ctx.lineCap = "round"

  function render(start, end) {
    start = start.scale(30).translate(new Vector(renderer.width/2, renderer.height/2))
    end = end.scale(30).translate(new Vector(renderer.width/2, renderer.height/2))
    ctx.beginPath()
    ctx.moveTo(start.getX(), start.getY())
    ctx.lineTo(end.getX(), end.getY())
    ctx.stroke()
    // console.log("x1", (start.getX() + renderer.width / 2), "y1", (start.getY() + renderer.height / 2), "x2", (end.getX() + renderer.width / 2), "y2", (end.getY() + renderer.height / 2))
  }

  this.run = function(iterations) { // iterations<0 means infinite (or an integer overflow in a few thousand years)
    var loop = setInterval(function(sub) {
      try {
        ctx.clearRect(0, 0, renderer.width, renderer.height);
        shape.rotate(render)//.pub(sub)
        if (iterations-- == 0) clearInterval(loop)
      } catch (e) {
        console.log("bailing from exception:", e)
        clearInterval(loop)
      }
    }, FPS, subscriber)
  }

  this.toggleClipping = function() {
    clipping = !clipping
    return this
  }
}

var runner = new threeD(document.getElementById('renderer'), console.log).run(3000)
