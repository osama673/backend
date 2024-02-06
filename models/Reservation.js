const mongoose = require("mongoose");

const ReservationSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    dateOfReservation: {
      type: Date,
      required: true,
      default: new Date(),
    },
    dateOfReturn: {
      type: Date,
    },
    isReturned: {
      type: Boolean,
      required: false,
      default: false,
    },
    isConfirmed: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = Reservation = mongoose.model("Reservation", ReservationSchema);
