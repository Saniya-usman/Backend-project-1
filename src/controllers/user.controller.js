import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ref } from "process";

const registerUser = asyncHandler( async (req, res) =>{
     //get  user details from frontend
     //validation - not empty
     //check if user already exits: username, email
     //check for images , check for avatar
     //upload them to cloudinary, avatar
     //create user object - create entry in db
     //remove password and refresh token field from response
     //check for user creation
     //return res


     //1. Get User details from frontend
     const {fullName, email, username, password} = req.body
     //console.log("email" , email);

     //2. validation fields
     if ([fullName, email, username, password].some((field)=>
     field?.trim() === "" )
     ) {
          throw new ApiError(400, "All fields are required")
     }

     //3. Check if user already exixts
      const existedUser = await User.findOne({
          $or : [{ username }, { email }]
      })
      if (existedUser) {
          throw new ApiError(409, "User with email or username already exists")
      }
       
       
      //4. Get image paths
      const avatarLocalPath = req.files?.avatar?.[0]?.path;
      const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

      //5. Check avatar
      if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
      }

      //6. Upload Images to cloudinary
      console.log("Avatar local path:", avatarLocalPath);
      const avatar = await uploadOnCloudinary(avatarLocalPath)
      const coverImage = await uploadOnCloudinary(coverImageLocalPath)


      // 7. Check avatar upload
      if (!avatar) {
        throw new ApiError(400, "Avatar upload failed")
      }

      // Create user in database
      const user = await User.create({
        fullName, 
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
      })
      
      //9.Remove password and refresh tokens
      const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
      )

      //10. Check user creation
      if(!createdUser) {
        throw new ApiError(500, "Something went wrong while registering user" )
      }

      //11. Return response
      return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered Successfully ")
      )


      



})


const generateAccessAndRefreshTokens = async(userId)=>{
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({validateBeforeSave : false})

    return {accessToken, refreshToken}
    
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating refresh and access token")
  }
}
const loginUser = asyncHandler(async (req, res) =>{

  //req body -> data
  //username or email
  //find the user
  //password check
  //access and refresh token
  //send cookie
  // send response


  const {username, email, password} = req.body

      if (!username || !email) {
        throw new ApiError(400, "username or email is required" )
      }

      const user = await User.findOne({
        $or : [{email}, {username}]
      })

      if (!user) {
        throw new ApiError(404, "User does not exixt")
      }

      const isPasswordValid = await user.isPasswordCorrect(password)

      if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentails")
      }

      const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

      const loggedInUser = await User.findById(user._id).select("-password, -refreshToken")

      const options = {
        httpOnly : true,
        secure: true
      }

      return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options ).json(
        new ApiResponse(
          200,
          {
            user: loggedInUser, accessToken,
            refreshToken
          },
          "User logged In successfully"
        )
      )
})



export { registerUser,
  loginUser,
 
 }