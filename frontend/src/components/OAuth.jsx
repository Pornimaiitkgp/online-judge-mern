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
            const provider= new GoogleAuthProvider();
            const auth=getAuth(app);

            const result= await signInWithPopup(auth, provider);
            const response=await fetch('/api/auth/google', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: result.user.displayName,
                    email: result.user.email,
                    avatar: result.user.photoURL,
                }),
            })
            const data = await response.json();
            console.log("Google auth response:", data);
            dispatch(signInSuccess(data));
            navigate('/');
        } catch (error) {
    if (error.code === 'auth/user-cancelled') {
      alert('Sign-in cancelled. Please try again.');
    } else {
      console.error('Could not sign in with Google:', error);
      alert('Something went wrong with Google Sign-In.');
                }
            }
    };                  
  return (
    <button onClick={handleGoogleClick} type='button' className='bg-red-700 text-white p-3 rounded-lg uppercase hover:opacity-95'>Continue with Google</button>
  )

};
