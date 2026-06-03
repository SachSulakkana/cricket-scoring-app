"use client";

import { Toaster } from "sonner";

export default function AppToaster() {
  return (
    <Toaster
      theme="dark"
      position="top-center"
      richColors
      closeButton
      duration={4000}
      toastOptions={{
        classNames: {
          toast: "cricket-toast",
          title: "cricket-toast__title",
          description: "cricket-toast__description",
        },
      }}
    />
  );
}
