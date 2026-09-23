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
  activateWaitingServiceWorker,
  dismissServiceWorkerUpdate,
  getServiceWorkerUpdateSnapshot,
  requestServiceWorkerUpdate,
  subscribeServiceWorkerUpdate,
} from "@/lib/serviceWorkerUpdate";
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

  useEffect(
    () => subscribeClientApiUpdateRequired(() => setIsUpdateRequired(true)),
    [],
  );

  const isOpen = isUpdateRequired || serviceWorkerUpdate.isUpdateAvailable;

  const applyUpdate = async () => {
    if (activateWaitingServiceWorker()) return;

    // API が更新必須を返したのに待機中の SW がない場合も、HTML を再検証して復旧を試みる。
    try {
      await requestServiceWorkerUpdate();
      if (activateWaitingServiceWorker()) return;
    } finally {
      window.location.reload();
    }
  };

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isUpdateRequired) {
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
            <AlertDialogCancel onClick={dismissServiceWorkerUpdate}>
              後で
            </AlertDialogCancel>
          )}
          <AlertDialogAction type="button" onClick={applyUpdate}>
            更新する
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
