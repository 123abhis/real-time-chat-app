import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";

// Update profile
export const updateProfile = async (req, res) => {
    try {
        const { fullName, email, profilePicture } = req.body;
        const userId = req.user._id;

        let profilePictureUrl = profilePicture;

        // If a new profile picture is provided as base64
        if (profilePicture && profilePicture.startsWith('data:image')) {
            const uploadResponse = await cloudinary.uploader.upload(profilePicture, {
                folder: 'chat-app/profile-pictures',
                resource_type: 'auto'
            });
            profilePictureUrl = uploadResponse.secure_url;
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    fullName: fullName || req.user.fullName,
                    email: email || req.user.email,
                    profilePicture: profilePictureUrl || req.user.profilePicture
                }
            },
            { new: true }
        ).select("-password");

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            data: updatedUser
        });
    } catch (error) {
        console.error("Error in updateProfile:", error);
        res.status(500).json({
            success: false,
            message: "Error updating profile",
            error: error.message
        });
    }
};

// Get user profile
export const getUserProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error("Error in getUserProfile:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching user profile",
            error: error.message
        });
    }
}; 