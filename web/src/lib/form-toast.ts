import { goto } from '$app/navigation';
import type { ActionResult, SubmitFunction } from '@sveltejs/kit';
import { toast } from 'svelte-sonner';

type MessageResolver = string | ((context: { formData: FormData }) => string);

type ToastEnhanceOptions = {
	success?: MessageResolver;
	error?: MessageResolver;
};

const resolveMessage = (resolver: MessageResolver | undefined, formData: FormData): string | null => {
	if (!resolver) return null;
	if (typeof resolver === 'function') {
		const value = resolver({ formData }).trim();
		return value.length ? value : null;
	}
	const value = resolver.trim();
	return value.length ? value : null;
};

const readFailureMessage = (result: ActionResult): string | null => {
	if (result.type !== 'failure' || !result.data || typeof result.data !== 'object') return null;
	const data = result.data as Record<string, unknown>;

	if (typeof data.error === 'string' && data.error.trim().length > 0) {
		return data.error.trim();
	}

	for (const [key, value] of Object.entries(data)) {
		if (!key.endsWith('_error')) continue;
		if (typeof value === 'string' && value.trim().length > 0) {
			return value.trim();
		}
	}

	return null;
};

export const createToastEnhance = (options: ToastEnhanceOptions = {}): SubmitFunction => {
	return ({ formData }) => {
		const successMessage =
			resolveMessage(options.success, formData) ?? 'Action completed successfully.';
		const fallbackErrorMessage = resolveMessage(options.error, formData) ?? 'Action failed.';

		return async ({ result, update }) => {
			if (result.type === 'success') {
				toast.success(successMessage);
				await update();
				return;
			}

			if (result.type === 'failure') {
				toast.error(readFailureMessage(result) ?? fallbackErrorMessage);
				await update();
				return;
			}

			if (result.type === 'redirect') {
				toast.success(successMessage);
				await goto(result.location);
				return;
			}

			if (result.type === 'error') {
				toast.error(fallbackErrorMessage);
				await update();
			}
		};
	};
};

