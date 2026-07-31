const mongoose=require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            minlength: [3, "Name must be at least 3 characters"],
            maxlength: [50, "Name cannot exceed 50 characters"],
        },

        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
        },

        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [8, "Password must be at least 8 characters"],
            select: false,
        },

        // Email Verification
        isEmailVerified: {
            type: Boolean,
            default: false,
        },

        emailVerificationCode: {
            type: String,
            default: null,
        },

        emailVerificationExpires: {
            type: Date,
            default: null,
        },

        // Password Reset
        resetPasswordToken: {
            type: String,
            default: null,
        },

        resetPasswordExpires: {
            type: Date,
            default: null,
        },

        // Profile
        avatar: {
            type: String,
            default: "",
        },
        acceptedTerms: {
            type: Boolean,
            default: false,
        },
        tokenVersion:{
            type:Number,
            default:0,
        }
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model("User", userSchema);

module.exports = User;