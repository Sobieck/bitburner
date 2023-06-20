// only starts when tor -> analyse gets bought. That should be something we are looking for after we've spun up all the servers. 

// 

// analyse the profitability/ ram cost of each server. sort by most profitable. -> once something is ided as needed to be hacked, we dispatch a weaken to get it to min, with a grow to get it to max. Then it enters the normal flow. 

//    the weaken for the grow phase is the first mover. Its end is the start of the window for the grow. This one gets dispatched first.
//    the grow needs to finish at after the end time of the  time
//    the 

// First - server name of being hacked. Batch end times. If the last batch end time is after the minimum end time for the next batch, we can dispatch the batch. 
    // batch data 
        //start, end of whole batch
        //start, end, server of where things will be run. This is important for cleanup. 

// Second, jobs queued to hacking servers + ram reserved. This ram reserved will be summed with the ram being used on the machine to see if we can add more jobs.
// startAfter job type  

