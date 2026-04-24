import { clsx, type ClassValue } from "clsx";
import type { DateTime } from "surrealdb";
import { twMerge } from "tailwind-merge";
import { localeStore } from "./stores";
import { get } from "svelte/store";
import { toast } from 'svelte-sonner';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, "children"> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

export function formatDate(date?: DateTime | string, withTime: boolean = false): string {
	if (!date) return '-';
	const nativeDate = typeof date === 'string' ? new Date(date) : date.toDate();
	const locale = get(localeStore);
	if (withTime) {
		return new Intl.DateTimeFormat(locale, {
			year: 'numeric',
			month: 'short',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		}).format(nativeDate);
	} else {
		return new Intl.DateTimeFormat(locale, {
			year: 'numeric',
			month: 'short',
			day: '2-digit'
		}).format(nativeDate);
	}
}

type ShareableJob = {
	id: string;
	website_url?: string;
	created_at?: string | null;
	status?: string;
};

export const copyToClipboard = async (value: string): Promise<void> => {
	if (navigator.clipboard?.writeText) {
		await navigator.clipboard.writeText(value);
		toast.success('Copied successfully.');
		return;
	}

	const textarea = document.createElement('textarea');
	textarea.value = value;
	textarea.setAttribute('readonly', '');
	textarea.style.position = 'fixed';
	textarea.style.opacity = '0';
	document.body.appendChild(textarea);
	textarea.select();
	try {
		document.execCommand('copy');
		toast.success('Copied successfully.');
	} catch(e) {
		toast.error('Copy failed.');
	} finally {
		document.body.removeChild(textarea);
	}
};

export const shareJob = async (origin: string | null, job: ShareableJob): Promise<void> => {
	const baseUrl = origin || window.location.origin;
	const shareData = {
		title: 'Hesperida Scan Results',
		text: `${job.website_url || 'Website'} scanned at ${job.created_at ?? ''}`.trim(),
		url: `${baseUrl}/jobs/${job.id}/pdf`
	};
	try {
		if (typeof navigator.share === 'function' && (window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0)) {
		// mobile only
			try {
				await navigator.share(shareData);
				return;
			} catch (error) {
				if (error instanceof DOMException && error.name === 'AbortError') return;
				await navigator.share({ url: shareData.url });
				return;
			}
		}

		await copyToClipboard(shareData.url ?? '');
	} catch (error) {
		if (error instanceof DOMException && error.name === 'AbortError') return;
		await copyToClipboard(shareData.url ?? '');
	}
};