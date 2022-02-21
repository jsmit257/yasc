## YASC

Yet Another Spinning Cube

Spinning cubes are a dime a dozen on the internet these days, you can make
one from a 10-minute youtube tutorial.  There's certainly another one or more with this same name, too, but this one was written in a way that's supposed to  highlight the linear algebra that drives the cube state and minimize the noise from javascript.  A single statement does all the interesting work, and the other 200-some lines are just to setup an environment and to connect the dots after each turn.

### what is it?
Boring?

Maybe at first, but algorithms like this are the building blocks for
all things virtual.  Any sort of complex shapes, textures, directional lighting,
collisions, a cool trick called [bumpmapping](https://en.wikipedia.org/wiki/Bump_mapping) - basically everything you see in a virtual reality is described by this and just a few other equations that are all related.

### how can i run it?
It isn't hosted anywhere, so you'll have to download [index.html](https://github.com/jsmit257/yasc/blob/master/index.html) to your desktop and open it in a browser; that's all; if the name conflicts with something already in your `Downloads` directory, then call it something different, like `3d.html`, the name doesn't matter; it's not technically standalone, but the javascript will be automatically pulled from this project when you open the page

### what does it do? how does it work?
Obviously, it spins a cube, but the point is to show some of the math needed to describe a 3 dimensional world, and only that.  The visual representation just makes it easier to prove that it's probably working.  There are only a few operations that really matter, and only one of them is actually interesting:
- scale: makes things bigger or smaller (e.g. `Vector(x * factor, y * factor, z * factor)`) moves a vector closer to, or further from the center of the map
- translate: moves things by adding a distance vector to the current location of a thing; basically, if i'm at the gas station and need to go to the pet store 3 blocks south and 2 blocks east, then i need to translate my current position by 3-south, 2-east
- transform: this is the fun part where the rotation happens; it comes in two flavors that are actually the same thing (i.e. matrix multiplication):
  - given a vector(roughly speaking, an absolute location, like one corner of a cube) and a matrix(a rotation, in this case your rotation), then the vector transformed by the matrix (`V.transform(M)`) tells where that vector *appears* to be, relative to where you're looking; keep in mind that the cube never actually moves, it's your head rotating inside it
  - you can also multiply 2 rotational matrices; this one's the general case of the one above; assuming your current rotation says you're upside down and backward relative to an absolute origin, and you want to turn one degree to *your* right, relative to where you currently are, then you transform your current rotational matrix by a new matrix that describes a 1 degree turn to the right from the origin, and the result is a new rotation in absolute terms, 1 degree to your right of where you used to be
- inverse: for a vector `V` and a matrix `M`, `V.transform(M).transform(M.invert())` will rotate the vector by `M`, and then rotate it back to its original position with `M.invert()`; similar to the way that `3 + 1 + -1` equals `3`, except that additive inverse doesn't seem like the right name for it; this function is currently unused
- parallax: this is the effect of train tracks appearing to get closer together the farther away you look; it's like scaling, but using the z-coordinate to calculate the x-/y-coords
- clipping: since your head is inside the cube, then lines that start behind you and end in front of you should be clipped at the plane `z = 0`; this is one case where code is more descriptive than maths (IMO); see the private clip function in the shape variable; not sure this is working correctly, but you can try it in the console with `runner.toggleClipping().run(2499)`

### why should it be interesting?
The short answer is that it's about as interesting as a brick.  As mentioned, it's not visually stunning like Sharknado or CoD; the code is clean-ish, I hope, but nothing special.  The brick we mean is really just 2 simple math statements (more or less), the rest is easily ignored.

But it's a brick that took 40000 years of human civilization to build, and if you understand one brick, you can build any skyscraper you can imagine just by stacking a bunch of them together.  The same way all computing is performed with `0`s and `1`s, all virtual realms are constructed with matrices and vectors (and since vectors *are* matrices, you don't really need to mention them).

More than that, this is just one use-case for linear algebra.  Once you grok it, you see it everywhere: stock markets, actuarial risk assessments, the way the fabric in Shrek's shirt stretches and bunches when his fat belly bounces.  This was mostly theoretical math until WWII when someone figured out how useful it was for dropping bombs more accurately than just eyeballing, now it solves all kinds of problems that have nothing to do with 3-dimensional space.  Too much of our great science was only discovered when we wanted to kill people, IMO.

I think it's interesting because it's a really difficult problem with an unbelievably simple solution.  Remember that simple doesn't exactly mean easy, this simple thing took me at least 3 months to figure out the first time.

### related links
- [A good place to start](https://www.mathsisfun.com/algebra/matrix-multiplying.html)
- [A more detailed description](https://en.wikipedia.org/wiki/Rotation_matrix)
- [If that's not enough math, try here](https://en.wikipedia.org/wiki/Linear_algebra)
