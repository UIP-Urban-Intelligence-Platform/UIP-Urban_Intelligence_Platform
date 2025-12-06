<!--
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.

UIP - Urban Intelligence Platform
CitizenReportForm component documentation.

Module: apps/traffic-web-app/frontend/docs/docs/frontend/components/CitizenReportForm.md
Author: UIP Team
Version: 1.0.0
-->

# CitizenReportForm Component

## Overview

The CitizenReportForm allows users to submit traffic reports with photos, descriptions, and location data, enabling citizen-powered traffic intelligence.

## Features

- **Photo Upload**: Camera or file upload with preview
- **Location Detection**: Auto-detect GPS location or manual pin
- **Category Selection**: Accident, congestion, hazard, etc.
- **Text Description**: Rich text editor for details
- **Validation**: Client-side validation before submission
- **Real-time Feedback**: Submission status and confirmation

## Props

```typescript
interface CitizenReportFormProps {
  onSubmit?: (report: CitizenReport) => void;
  defaultLocation?: [number, number];
  enableCamera?: boolean;
  maxPhotos?: number;
}
```

## Usage

### Basic Usage

```tsx
import CitizenReportForm from '@/components/CitizenReportForm';

export default function ReportPage() {
  const handleSubmit = (report) => {
    console.log('Report submitted:', report);
  };
  
  return (
    <CitizenReportForm
      onSubmit={handleSubmit}
      enableCamera={true}
      maxPhotos={3}
    />
  );
}
```

### With Location

```tsx
<CitizenReportForm
  defaultLocation={[10.7769, 106.7009]}
  onSubmit={handleSubmit}
/>
```

## Component Structure

```tsx
const CitizenReportForm: React.FC<CitizenReportFormProps> = ({
  onSubmit,
  defaultLocation,
  enableCamera = true,
  maxPhotos = 3
}) => {
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    location: defaultLocation || null,
    photos: []
  });
  
  const handlePhotoUpload = (files: File[]) => {
    // Upload logic
  };
  
  const handleLocationSelect = (coords: [number, number]) => {
    setFormData(prev => ({ ...prev, location: coords }));
  };
  
  const handleSubmit = async () => {
    const result = await submitReport(formData);
    onSubmit?.(result);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <CategorySelect value={formData.category} onChange={...} />
      <LocationPicker value={formData.location} onChange={handleLocationSelect} />
      <PhotoUpload max={maxPhotos} onChange={handlePhotoUpload} />
      <TextArea value={formData.description} onChange={...} />
      <Button type="submit">Submit Report</Button>
    </form>
  );
};
```

## Form Fields

### Category Selection

```tsx
<Select
  label="Report Type"
  options={[
    { value: 'accident', label: 'Accident' },
    { value: 'congestion', label: 'Traffic Jam' },
    { value: 'hazard', label: 'Road Hazard' },
    { value: 'construction', label: 'Construction' },
    { value: 'other', label: 'Other' }
  ]}
/>
```

### Photo Upload

```tsx
<PhotoUpload
  max={3}
  accept="image/*"
  onUpload={handlePhotoUpload}
  enableCamera={true}
/>
```

### Location Picker

```tsx
<LocationPicker
  defaultLocation={[10.7769, 106.7009]}
  onLocationChange={handleLocationSelect}
  enableGPS={true}
/>
```

## Validation

```typescript
const validateForm = (data: FormData): ValidationResult => {
  const errors: string[] = [];
  
  if (!data.category) errors.push('Category is required');
  if (!data.location) errors.push('Location is required');
  if (data.description.length < 10) errors.push('Description too short');
  if (data.photos.length === 0) errors.push('At least one photo required');
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
```

## Integration Examples

### With Map

```tsx
<div className="report-container">
  <CitizenReportMap onLocationSelect={setLocation} />
  <CitizenReportForm defaultLocation={location} />
</div>
```

### With Success Modal

```tsx
const [showSuccess, setShowSuccess] = useState(false);

const handleSubmit = async (report) => {
  await submitReport(report);
  setShowSuccess(true);
};

return (
  <>
    <CitizenReportForm onSubmit={handleSubmit} />
    {showSuccess && (
      <SuccessModal
        title="Report Submitted"
        message="Thank you for your report!"
        onClose={() => setShowSuccess(false)}
      />
    )}
  </>
);
```

## Styling

```css
.citizen-report-form {
  max-width: 600px;
  margin: 0 auto;
  padding: 24px;
}

.photo-preview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.submit-button {
  width: 100%;
  padding: 12px;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
}
```

## Related Components

- [CitizenReportMap](./CitizenReportMap.md)
- [LocationPicker](./LocationPicker.md)
- [PhotoUpload](./PhotoUpload.md)

## License

MIT License - Copyright (c) 2025 UIP Contributors (Nguyễn Nhật Quang, Nguyễn Việt Hoàng, Nguyễn Đình Anh Tuấn)
