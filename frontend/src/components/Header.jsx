import { FaSearch } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function Header() {
  const { currentUser } = useSelector(state => state.user);

  return (
    <header className='bg-slate-200 shadow-md'>
      <div className='flex justify-between items-center max-w-6xl mx-auto p-3'>
        <Link to='/'>
          <h1 className='font-bold text-sm sm:text-xl flex flex-wrap'>
            <span className='text-slate-500'>algo</span>
            <span className='text-slate-700'>Quest</span>
          </h1>
        </Link>
        <form className='bg-slate-100 p-3 rounded-lg flex items-center'>
          <input
            type="text"
            placeholder="Search..."
            className='bg-transparent focus:outline-none w-24 sm:w-64'
          />
          <FaSearch className='text-slate-600' />
        </form>
        <ul className='flex gap-4'>
          <Link to='/'>
            <li className='hidden sm:inline text-slate-700 hover:underline'>Home</li>
          </Link>
          <Link to='/about'>
            <li className='hidden sm:inline text-slate-700 hover:underline'>About</li>
          </Link>

          {/* NEW: Link to Problems List (General access) */}
          <Link to='/problems'>
            <li className='hidden sm:inline text-slate-700 hover:underline'>Problems</li>
          </Link>

          {/* NEW: Conditional Link for Create Problem (Admin Only) */}
          {currentUser && currentUser.isAdmin && (
            <Link to='/create-problem'> {/* Notice: /create-problem (singular) */}
              <li className='hidden sm:inline text-slate-700 hover:underline'>Create Problem</li>
            </Link>
          )}
          
          {/* NEW: Conditional Link for My Submissions (User Logged In Only) */}
          {currentUser && ( // Only show if a user is logged in
            <Link to='/mysubmissions'>
              <li className='hidden sm:inline text-slate-700 hover:underline'>My Submissions</li>
            </Link>
          )}

          {/* Profile/Sign In Link Logic */}
          {currentUser ? (
            <Link to='/profile'>
              <img
                className='rounded-full h-7 w-7 object-cover'
                src={currentUser.avatar}
                alt='profile'
              />
            </Link>
          ) : (
            <Link to='/signin'>
              <li className='text-slate-700 hover:underline'>Sign in</li>
            </Link>
          )}
        </ul>
      </div>
    </header>
  );
}