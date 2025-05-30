import React from '@wordpress/element';

const Dashboard = () => {
    return React.createElement('div', {
        style: { 
            padding: '20px', 
            background: '#fff', 
            margin: '20px', 
            borderRadius: '8px', 
            border: '2px solid #4caf50',
            fontFamily: 'Arial, sans-serif'
        }
    }, [
        React.createElement('h1', { 
            key: 'title',
            style: { color: '#333', fontSize: '24px', marginBottom: '16px' } 
        }, 'Portal Dashboard - Simple Test'),
        React.createElement('p', { 
            key: 'text',
            style: { color: '#666', fontSize: '16px' } 
        }, 'React component is working! No JSX, no hooks, just pure React.createElement.'),
        React.createElement('div', {
            key: 'success',
            style: { 
                marginTop: '20px', 
                padding: '15px', 
                background: '#e8f5e8', 
                borderRadius: '4px',
                color: '#2e7d32'
            }
        }, '✅ Success: Basic React rendering is functional!')
    ]);
};

export default Dashboard; 