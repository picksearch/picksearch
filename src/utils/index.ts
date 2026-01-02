import { format as dateFnsFormat } from 'date-fns';
import { toZonedTime, format as tzFormat } from 'date-fns-tz';

const KST_TIMEZONE = 'Asia/Seoul';

export function createPageUrl(pageName: string) {
    return '/' + pageName.toLowerCase().replace(/ /g, '-');
}

/**
 * Format a date in KST (Korea Standard Time, GMT+9)
 * @param date - Date object, ISO string, or timestamp
 * @param formatStr - date-fns format string (default: 'yyyy.MM.dd HH:mm')
 * @returns Formatted date string in KST
 */
export function formatKST(date: Date | string | number | null | undefined, formatStr: string = 'yyyy.MM.dd HH:mm'): string {
    if (!date) return '-';
    try {
        const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
        if (isNaN(dateObj.getTime())) return '-';
        const kstDate = toZonedTime(dateObj, KST_TIMEZONE);
        return tzFormat(kstDate, formatStr, { timeZone: KST_TIMEZONE });
    } catch {
        return '-';
    }
}