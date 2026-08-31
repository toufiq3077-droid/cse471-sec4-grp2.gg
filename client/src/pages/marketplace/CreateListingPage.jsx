import React from 'react';
import { cropApi } from '../../services/cropApi';
import ListingForm from '../../components/marketplace/ListingForm';

export default function CreateListingPage() {
  return (
    <ListingForm
      heading="Add a New Crop Listing"
      subheading="List your fresh produce on the marketplace"
      submitLabel="Create Listing"
      onSubmit={cropApi.create}
    />
  );
}
