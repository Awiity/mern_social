import { useCallback, useState, useEffect } from "react";

function useFetch<DataType = unknown>(url: string) {
    const [data, setData] = useState<DataType | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [isLoading, setLoading] = useState<boolean>(false);
    const [reloadCount, setReloadCount] = useState<number>(0)

    const reload = useCallback(() => {
        setReloadCount(prev => prev + 1);
    }, []);

    useEffect(() => {
        const abortController = new AbortController();
        const signal = abortController.signal;

        const fetchData = async () => {
            setLoading(true);
            setData(null);
            setError(null);
            try {

                const response = await fetch(url, { signal });

                if (!response.ok) throw new Error(`HTTPError: status ${response.status}`);

                const jsonData = (await response.json()) as DataType;
                setData(jsonData);

            } catch (error) {
                if (error instanceof Error) {
                    if (error.name === "AbortError") { console.log("Fetch aborted.") }
                    else { setError(error) }
                } else {
                    setError(new Error("An unknown error has occured."))
                }
            } finally {
                setLoading(false);
            }
        }
        fetchData();

        return () => abortController.abort();
    }, [url, reloadCount]);

    return { data, setData, isLoading, error, reload };
};

export default useFetch;