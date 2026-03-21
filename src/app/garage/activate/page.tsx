import { redirect } from 'next/navigation';

// Redirect to the main activation page
export default function GarageActivatePage() {
  redirect('/garage/activer-qr');
}
