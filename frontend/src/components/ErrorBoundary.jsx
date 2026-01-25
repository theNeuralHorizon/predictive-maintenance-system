import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-8">
                    <h1 className="text-3xl font-bold text-red-500 mb-4">Something went wrong.</h1>
                    <div className="bg-gray-800 p-6 rounded-lg border border-red-700 max-w-2xl w-full overflow-auto">
                        <h2 className="text-xl font-semibold mb-2">Error Details:</h2>
                        <pre className="text-red-300 font-mono text-sm whitespace-pre-wrap">
                            {this.state.error && this.state.error.toString()}
                        </pre>
                        <details className="mt-4">
                            <summary className="cursor-pointer text-gray-400">Component Stack</summary>
                            <pre className="text-gray-500 text-xs mt-2 overflow-x-auto">
                                {this.state.errorInfo && this.state.errorInfo.componentStack}
                            </pre>
                        </details>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-8 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded transition"
                    >
                        Reload Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
