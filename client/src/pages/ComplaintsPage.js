const handleStatusUpdate = async (complaintId, status) => {
    try {
        const response = await apiService.updateComplaintStatus(complaintId, { status });
        if (response.success) {
            // Refresh the complaints list
            await fetchComplaints();
            setSuccess('Complaint status updated successfully');
            setTimeout(() => setSuccess(null), 3000);
        }
    } catch (error) {
        setError(error.response?.data?.message || 'Failed to update complaint status');
        setTimeout(() => setError(null), 3000);
    }
}; 