export function withoutPropagation<EventType extends Event, Args extends unknown[]>(
    listener?: (...args: Args) => void,
    ...args: Args
): (e: EventType) => void {
    return (e: EventType) => {
        e.stopPropagation();
        listener?.(...args);
    };
}
