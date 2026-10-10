import { useEffect, useState, useSyncExternalStore } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  applyServiceWorkerUpdate,
  dismissServiceWorkerUpdate,
  getServiceWorkerUpdateSnapshot,
  subscribeServiceWorkerUpdate,
} from "./serviceWorkerUpdate";
import {
  getClientApiUpdateRequiredEvent,
  subscribeClientApiUpdateRequired,
} from "@/lib/clientApiUpdateRequired";

export default function ServiceWorkerUpdateDialog() {
  const serviceWorkerUpdate = useSyncExternalStore(
    subscribeServiceWorkerUpdate,
    getServiceWorkerUpdateSnapshot,
    getServiceWorkerUpdateSnapshot,
  );
  const [isUpdateRequired, setIsUpdateRequired] = useState(
    () => getClientApiUpdateRequiredEvent() !== null,
  );
  const [isApplyingUpdate, setIsApplyingUpdate] = useState(false);

  useEffect(
    () => subscribeClientApiUpdateRequired(() => setIsUpdateRequired(true)),
    [],
  );

  const isOpen = isUpdateRequired || serviceWorkerUpdate.isUpdateAvailable;

  const applyUpdate = async () => {
    setIsApplyingUpdate(true);
    try {
      const result = await applyServiceWorkerUpdate();
      if (result === "reload") {
        window.location.reload();
      }
    } finally {
      setIsApplyingUpdate(false);
    }
  };

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isUpdateRequired && !isApplyingUpdate) {
          dismissServiceWorkerUpdate();
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isUpdateRequired
              ? "アプリの更新が必要です"
              : "アプリを更新できます"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isUpdateRequired
              ? "このバージョンはサポート対象外です。更新してから続行してください。"
              : "新しいバージョンがあります。更新すると最新の状態を利用できます。"}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {!isUpdateRequired && (
            <AlertDialogCancel disabled={isApplyingUpdate}>
              後で
            </AlertDialogCancel>
          )}
          <AlertDialogAction
            type="button"
            disabled={isApplyingUpdate}
            onClick={applyUpdate}
          >
            {isApplyingUpdate ? "更新中…" : "更新する"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
