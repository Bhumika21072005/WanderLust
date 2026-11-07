const express=require("express");
const app=express();
const Listing=require("./models/listings.js");
const mongoose=require("mongoose");
const path=require("path");
const methodOverride=require("method-override");
const ejsMate=require("ejs-mate");
const wrapAsync=require("./utils/wrapAsync.js");
const ExpressError=require("./utils/ExpressError.js");
const listingSchema=require("./schema.js");

main().then(()=>{
    console.log("connected to db");
}).catch((err)=>{
    console.log(err);
});
async function main(){
    await mongoose.connect("mongodb://127.0.0.1:27017/wanderlust");
}

//Middleware to implement joi as function
 const validateListing=(req,res,next)=>{
  const {error}= listingSchema.validate(req.body);
   if(error){
    throw new ExpressError(400,error.details[0].message);
   }else{
    next();
   }
 }
 
app.get("/",(req,res)=>{
  res.send("Hi,I am root");  
});
app.listen(8080,() => {
    console.log("server is listening to port 8080");
});

// app.get("/testListing",async (req,res)=>{
//     try{
//     let sampleListing=new Listing({
//         title:"My new Villa",
//         description:"By the Beach",
//         price:1200,
//         location:"Calcutta",
//         Country:"India"
//     });
//     await sampleListing.save();
//     console.log("Sample.save");
//     res.send("Successful");
// }
// catch(err){
//     console.log(err);
//     res.status(500).send("Error saving listing");
// }

// });
app.engine("ejs",ejsMate);
app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname,"/public")));
// app.ejsMate('ejs', ejsMate);

//INDEX ROUTE
app.get("/listings",wrapAsync(async(req,res)=>{
  const allListings= await  Listing.find({});
  res.render("listing/index",{allListings});

}));

//NEW ROUTE
app.get("/listings/new",(req,res)=>{
   res.render("listing/new") 
})
//SHOW ROUTE
app.get("/listings/:id",wrapAsync(async(req,res)=>{
    let {id}=req.params;
    const listings=await Listing.findById(id);
    res.render("listing/show.ejs",{listings});
}));

//CREATE ROUTE
app.post("/listings",validateListing,wrapAsync(async(req,res)=>{

   
    // let {title,description,image,price,location,country}=req.body;
   
    if(!req.body.listing){
        throw new ExpressError(400,"Send Valid data for listing");
    }
    //Server side schema Validation
//     let result= listingSchema.validate(req.body);
//       console.log(result);
//    const {error}= listingSchema.validate(req.body);
//    if(error){
//     throw new ExpressError(400,error.details[0].message);
//    }


   
    
    const listing=req.body.listing;
    const newListing=new Listing(listing);
    // if(!newListing.title){
    //     throw new ExpressError(400,"Title is missing");
    // }
    // if(!newListing.description){
    //     throw new ExpressError(400,"Description is missing");
    // }
    // if(!newListing.location){
    //     throw new ExpressError(400,"Location is missing");
    // }
  //INSTEAD OF THESE MANY IF STATEMENTS WE CAN SIMPLY USE JOI WHICH AN API 
  // WHICH HELPS IN SCHEMA VALIDATION

   
    await newListing.save();
    res.redirect("/listings");
  
   



}));


//EDIT ROUTE
app.get("/listings/:id/edit",wrapAsync(async(req,res)=>{
    let {id}=req.params;
    const listing=await Listing.findById(id);
    res.render("listing/edit.ejs",{listing});

}));
//UPDATE ROUTE
app.put("/listings/:id",validateListing,wrapAsync(async(req,res)=>{
    let {id}=req.params;
   await Listing.findByIdAndUpdate(id,{...req.body.listing},{runValidators:true});
   res.redirect(`/listings/${id}`);
}));
//DELETE ROUTE

app.delete("/listings/:id",wrapAsync(async(req,res)=>{
    let {id}=req.params;
    let deletedListing=await Listing.findByIdAndDelete(id);

  console.log(deletedListing);
  res.redirect("/listings");
}));

app.all("/*splat",(req,res,next)=>{
    next(new ExpressError(404,"Page not found"));
})
//Middleware to check on custom errors

app.use((err,req,res,next)=>{
    let {statusCode=500,message="Something went Wrong"}=err;
    // res.status(statusCode).send(message);
    res.status(statusCode).render("error.ejs",{err});
   
});



