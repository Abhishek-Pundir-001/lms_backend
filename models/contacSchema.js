import { Schema,model } from "mongoose";

const contactSchema = new Schema({
name:{
    type:String,
    required:[true,'name is required'],
    trim:true
},
email:{
    type:String,
    required:[true,'email is required'],
    trim:true
},
mobile:{
    type:Number,
    required:[true,'email is required']
},
message:{
    type:String,
    required:[true,'message is required']
},
},{timestamps:true})

const contactModel = model('user_contact',contactSchema);

export default contactModel