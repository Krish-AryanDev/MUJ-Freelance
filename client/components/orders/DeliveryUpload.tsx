'use client';

import { useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';

import { orderService } from '@/services/order.service';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';

interface DeliveryUploadProps {
  orderId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function DeliveryUpload({ orderId, onSuccess, onCancel }: DeliveryUploadProps) {
  const [deliveryMessage, setDeliveryMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSize = useMemo(() => files.reduce((acc, file) => acc + file.size, 0), [files]);

  const handleFileSelection = (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) {
      return;
    }

    setFiles((current) => [...current, ...Array.from(selectedFiles)]);
  };

  const onSubmit = async () => {
    if (deliveryMessage.trim().length < 20) {
      toast.error('Delivery message must be at least 20 characters');
      return;
    }

    try {
      setIsSubmitting(true);
      await orderService.deliverOrder(orderId, {
        deliveryMessage: deliveryMessage.trim(),
        attachments: files.map((file) => file.name),
      });
      toast.success('Delivery submitted successfully');
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to submit delivery');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-zinc-900">Submit Delivery</h3>
        <p className="text-sm text-zinc-600">Share what you completed for this order.</p>
      </div>

      <Textarea
        label="Describe what you have completed"
        rows={5}
        required
        value={deliveryMessage}
        onChange={(event) => setDeliveryMessage(event.target.value)}
      />

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-900">Attachments</label>
        <label
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-sm text-zinc-600"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            handleFileSelection(event.dataTransfer.files);
          }}
        >
          <span>Drag and drop files here, or click to upload</span>
          <Input
            type="file"
            multiple
            className="hidden"
            onChange={(event) => handleFileSelection(event.target.files)}
          />
        </label>

        {files.length > 0 ? (
          <div className="rounded-md border border-zinc-200 bg-white p-3 text-sm text-zinc-700">
            <p className="mb-2 font-medium">Selected files</p>
            <ul className="space-y-1">
              {files.map((file) => (
                <li key={`${file.name}-${file.size}`}>{file.name} ({Math.ceil(file.size / 1024)} KB)</li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-zinc-500">Total size: {Math.ceil(totalSize / 1024)} KB</p>
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <Button type="button" isLoading={isSubmitting} onClick={() => void onSubmit()}>
          Deliver Order
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export type { DeliveryUploadProps };
