// app/edit-page/page.tsx
import { ImageEditor } from '@/components/ImageEditor'
import { getCurrentUser, validateToken } from '@/lib/auth'
import { TokenAuthForm } from '@/components/TokenAuthForm'

export default async function EditPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  // Get query parameters
  const params = await searchParams;

  const fid = typeof params.fid === 'string' ? params.fid : '';
  const token = typeof params.token === 'string' ? params.token : '';
  
  // Check if user is already authenticated
  const currentUser = await getCurrentUser();

  // If user is already authenticated
  if (currentUser) {
    if (fid && currentUser !== fid) {
      return (
        <div className="p-4 text-red-500">
          Error: You are authenticated as a different user
        </div>
      )
    }
    
    return (
      <main className="container mx-auto p-4">
        <ImageEditor fid={currentUser} />
      </main>
    )
  }

  // If token is provided, attempt authentication
  if (token && fid) {
    return <TokenAuthForm token={token} fid={fid} />;
  }

  // If no auth parameters provided
  return (
    <div className="p-4 text-red-500">
      Error: Missing fid or a valid token as a query parameter
    </div>
  );
}