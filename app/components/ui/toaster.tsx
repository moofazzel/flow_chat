import { Toaster as SonnerToaster } from "sonner"

export function Toaster() {
  return (
    <SonnerToaster 
      position="bottom-right"
      toastOptions={{
        style: {
          background: '#313338',
          border: '1px solid #1e1f22',
          color: '#dcddde',
        },
      }}
    />
  )
}
