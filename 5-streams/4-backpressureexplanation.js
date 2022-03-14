//backpressure

/* Imagine a water tank: 
1. there is one inlet valve: 
a hole with a diameter of 5 cms. connected to an inlet 
pipe. Water incoming rate is 2 liters/second.
2. there is one outlet valve 
a small hold with a shower head. mutiple small holder. 
water processing/ outlet rate is 200ml/second

The capacity of the water tank is 50 liters.

now you turn the water source on, the water starts flowing into the tank. 
the water also start getting out through the small hole. 
since water input rate is much higher than the output rate, the water level in the 
tank will start rising. 
there will be a time when the water level is full. if there input 
continue to try to put more water into the tank, the tank may burst. 
This is called backpressure. 

In such case, there needs to be some mechanism in  palce that can control the flow of water 
in a manner that the tank never bursts. 
This is called a backpressure mechanism. 

*/

/* Suppose a readable stream is trying to write some data to a writable stream, 
it the writable stream has not finished writing the current chunk, the data chunk will be added to the
buffer. If this keeps piling up, buffer may end up consuming a lot of memory. 
If there are a lot of objects in the buffer, when the GC kicks in 
to clean the buffer memory, it will have to handle a lot of objects/data. sweep cycles will be very long
may be very ineffective. 


*/

/* Node controls how much information can be processed by a stream by setting the buffer size 
using a highWatermark attribute of the stream. 

The default is 16KB (if the chunk is a buffer/string)
or 16 objects (if the objectMode is set to true)
 */