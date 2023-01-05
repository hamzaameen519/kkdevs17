import { number } from "joi";

const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const bookingSchema = new Schema(
  {
    trainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    trainee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },
    status: {
      type: String,
      required: false,
    },
    // amount:{type:number,default:0}
  },
  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema, "bookings");
