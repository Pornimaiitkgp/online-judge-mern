// import {GoogleAuthProvider, getAuth, signInWithPopup} from 'firebase/auth';
// import { app } from '../firebase';
// import { useDispatch } from 'react-redux';
// import { signInSuccess } from '../redux/user/userSlice';
// import { useNavigate } from 'react-router-dom';

// export default function OAuth() {
//     const dispatch = useDispatch();
//     const navigate = useNavigate();

//     const handleGoogleClick= async () => {
//         try {
//             const provider = new GoogleAuthProvider();
//             const auth = getAuth(app);

//             const result = await signInWithPopup(auth, provider);
            
//             // Send user info to your backend's Google authentication route
//             const response = await fetch('/api/auth/google', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({
//                     name: result.user.displayName,
//                     email: result.user.email,
//                     avatar: result.user.photoURL,
//                 }),
//             });
            
//             const data = await response.json();
//             console.log("Google auth response from backend:", data); // Log the full response

//             // *** CRITICAL FIXES START HERE ***

//             // 1. Store the JWT token in localStorage
//             // Assuming your backend responds with { user: {...}, token: "jwt_token_string" }
//             if (data.token) {
//                 localStorage.setItem('token', data.token);
//                 console.log('JWT Token successfully stored in localStorage (from Google Auth).');
//             } else {
//                 console.warn('No token received from backend for Google Auth. Check your /api/auth/google endpoint response.');
//             }

//             // 2. Dispatch only the user object to Redux
//             // Assuming data.user contains the user details (including isAdmin)
//             if (data.user) {
//                 dispatch(signInSuccess(data.user));
//             } else {
//                 console.warn('No user object received from backend for Google Auth. Check your /api/auth/google endpoint response.');
//             }
            
//             // *** CRITICAL FIXES END HERE ***

//             navigate('/'); // Navigate to home page after successful sign-in
//         } catch (error) {
//             if (error.code === 'auth/popup-closed-by-user') { // Common Firebase error for closed pop-up
//                 alert('Sign-in cancelled. Please try again.');
//             } else {
//                 console.error('Could not sign in with Google:', error);
//                 alert('Something went wrong with Google Sign-In.');
//             }
//         }
//     };                  

//     return (
//         <button 
//             onClick={handleGoogleClick} 
//             type='button' 
//             className='bg-red-700 text-white p-3 rounded-lg uppercase hover:opacity-95'
//         >
//             Continue with Google
//         </button>
//     );
// }


import {GoogleAuthProvider, getAuth, signInWithPopup} from 'firebase/auth';
import { app } from '../firebase';
import { useDispatch } from 'react-redux';
import { signInSuccess } from '../redux/user/userSlice';
import { useNavigate } from 'react-router-dom';

export default function OAuth() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleGoogleClick= async () => {
        try {
            const provider = new GoogleAuthProvider();
            const auth = getAuth(app);

            const result = await signInWithPopup(auth, provider);

            // Send user info to your backend's Google authentication route
            const response = await fetch('/api/auth/google', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: result.user.displayName,
                    email: result.user.email,
                    avatar: result.user.photoURL,
                }),
            });

            const data = await response.json();
            console.log("Google auth response from backend:", data); // Log the full response

            // *** CRITICAL FIX: Ensure the object dispatched to Redux includes the token ***
            if (data.user && data.token) {
                // Combine the user object and the token into a single object
                // This object will become `currentUser` in your Redux store.
                const userWithToken = { ...data.user, token: data.token };

                // Store the JWT token in localStorage (if still needed here, usually redundant with Redux-Persist)
                // However, if other parts of your app directly read from localStorage, keep this.
                localStorage.setItem('token', data.token); //
                console.log('JWT Token successfully stored in localStorage (from Google Auth).');

                // Dispatch the combined user object with the token to Redux
                dispatch(signInSuccess(userWithToken));
            } else {
                console.warn('Incomplete data received from backend for Google Auth. Expected user object AND token.');
            }
            // *** END CRITICAL FIX ***

            navigate('/'); // Navigate to home page after successful sign-in
        } catch (error) {
            if (error.code === 'auth/popup-closed-by-user') {
                alert('Sign-in cancelled. Please try again.');
            } else {
                console.error('Could not sign in with Google:', error);
                alert('Something went wrong with Google Sign-In.');
            }
        }
    };

    return (
        <button
            onClick={handleGoogleClick}
            type='button'
            className='bg-red-700 text-white p-3 rounded-lg uppercase hover:opacity-95'
        >
            Continue with Google
        </button>
    );
}