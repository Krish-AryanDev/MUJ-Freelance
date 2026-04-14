import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    freelancerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    commissionPercent: {
      type: Number,
      default: 3,
    },
    commission: {
      type: Number,
      required: true,
    },
    freelancerAmount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'released', 'refunded'],
      default: 'pending',
    },
    paidAt: { type: Date },
    releasedAt: { type: Date },
    refundedAt: { type: Date },
    failedAt: { type: Date },
    notes: { type: String },
  },
  {
    timestamps: true,
  },
);

const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);

export default Payment;
