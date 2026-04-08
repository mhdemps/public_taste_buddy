import { RouterProvider } from 'react-router';
import { router } from './routes';
import { BuddiesProvider } from './context/BuddiesContext';

export default function App() {
  return (
    <BuddiesProvider>
      <RouterProvider router={router} />
    </BuddiesProvider>
  );
}