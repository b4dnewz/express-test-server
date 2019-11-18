import { Handler } from "./server";

/**
 * Custom route handler method
 */
export default function send(fn?: Handler) {
    return (req, res, next) => {
        const cb = typeof fn === "function" ? fn(req, res, next) : fn;

        Promise.resolve(cb).then((val) => {
            if (val) {
                res.send(val);
            }
        });
    };
}
