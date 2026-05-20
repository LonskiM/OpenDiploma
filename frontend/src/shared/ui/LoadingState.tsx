interface LoadingStateProps {
    message?: string;
}

const LoadingState = ({ message = "Loading..." }: LoadingStateProps) => {
    return (
        <div className="loading" role="status" aria-live="polite">
            <span className="spinner" aria-hidden="true" />
            <span>{message}</span>
        </div>
    );
};

export default LoadingState;
