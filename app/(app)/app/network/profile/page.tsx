"use client";

import { useEffect, useState } from "react";
import { AccessDeniedState } from "@/components/shared/access-denied";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { useFlowV4 } from "@/components/shared/flow-v4-provider";
import { Button, Card, Input, PageHeader, Select, Textarea } from "@/components/shared/ui";
import { BusinessProfile, NetworkPreference } from "@/lib/v4-types";

export default function NetworkProfilePage() {
  const { canAccess } = useBusinessOS();
  const {
    currentBusinessProfile,
    networkPreferences,
    updateBusinessProfile,
    updateNetworkPreferences
  } = useFlowV4();
  const [profileMessage, setProfileMessage] = useState("");
  const [preferencesMessage, setPreferencesMessage] = useState("");
  const [profileForm, setProfileForm] = useState({
    displayName: "",
    businessType: "services" as BusinessProfile["businessType"],
    city: "",
    country: "Zimbabwe",
    about: "",
    email: "",
    phone: "",
    logoDataUrl: "",
    visibility: "public" as BusinessProfile["visibility"],
    operatingStatus: "active" as BusinessProfile["operatingStatus"],
    productsSummary: ""
  });
  const [preferencesForm, setPreferencesForm] = useState({
    allowDiscovery: true,
    allowConnectionRequests: true,
    defaultProfileVisibility: "public" as NetworkPreference["defaultProfileVisibility"],
    defaultCatalogVisibility: "connections" as NetworkPreference["defaultCatalogVisibility"],
    shareContactDetails: true,
    shareBranchSummary: true
  });

  useEffect(() => {
    if (currentBusinessProfile) {
      setProfileForm({
        displayName: currentBusinessProfile.displayName,
        businessType: currentBusinessProfile.businessType,
        city: currentBusinessProfile.city,
        country: currentBusinessProfile.country,
        about: currentBusinessProfile.about || "",
        email: currentBusinessProfile.email || "",
        phone: currentBusinessProfile.phone || "",
        logoDataUrl: currentBusinessProfile.logoDataUrl || "",
        visibility: currentBusinessProfile.visibility,
        operatingStatus: currentBusinessProfile.operatingStatus,
        productsSummary: currentBusinessProfile.productsSummary || ""
      });
    }
  }, [currentBusinessProfile]);

  useEffect(() => {
    if (networkPreferences) {
      setPreferencesForm({
        allowDiscovery: networkPreferences.allowDiscovery,
        allowConnectionRequests: networkPreferences.allowConnectionRequests,
        defaultProfileVisibility: networkPreferences.defaultProfileVisibility,
        defaultCatalogVisibility: networkPreferences.defaultCatalogVisibility,
        shareContactDetails: networkPreferences.shareContactDetails,
        shareBranchSummary: networkPreferences.shareBranchSummary
      });
    }
  }, [networkPreferences]);

  if (!canAccess("view_network")) {
    return (
      <AccessDeniedState description="Network profile visibility is limited to roles with network access." />
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Network profile"
        title="Control how your business appears in the Flow network."
        description="Keep public network identity separate from internal financial data, and choose how visible your business, branches, and catalogs should be."
      />

      <div className="two-col">
        <Card>
          <p className="eyebrow">Business profile</p>
          <form
            className="form-stack"
            onSubmit={(event) => {
              event.preventDefault();
              setProfileMessage(updateBusinessProfile(profileForm).message);
            }}
          >
            {profileMessage ? <div className="notice">{profileMessage}</div> : null}
            <div className="form-grid">
              <Input
                label="Display name"
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, displayName: event.target.value }))
                }
                value={profileForm.displayName}
              />
              <Select
                label="Business type"
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...current,
                    businessType: event.target.value as BusinessProfile["businessType"]
                  }))
                }
                value={profileForm.businessType}
              >
                <option value="services">Services</option>
                <option value="agency">Agency</option>
                <option value="wholesale">Wholesale</option>
                <option value="distributor">Distributor</option>
                <option value="retailer">Retailer</option>
                <option value="manufacturer">Manufacturer</option>
                <option value="logistics">Logistics</option>
                <option value="trading">Trading</option>
              </Select>
              <Input
                label="City"
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, city: event.target.value }))
                }
                value={profileForm.city}
              />
              <Input
                label="Country"
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, country: event.target.value }))
                }
                value={profileForm.country}
              />
              <Input
                label="Email"
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, email: event.target.value }))
                }
                value={profileForm.email}
              />
              <Input
                label="Phone"
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, phone: event.target.value }))
                }
                value={profileForm.phone}
              />
            </div>
            <Textarea
              label="About"
              onChange={(event) =>
                setProfileForm((current) => ({ ...current, about: event.target.value }))
              }
              value={profileForm.about}
            />
            <Textarea
              label="Products / services summary"
              onChange={(event) =>
                setProfileForm((current) => ({
                  ...current,
                  productsSummary: event.target.value
                }))
              }
              value={profileForm.productsSummary}
            />
            <div className="form-grid">
              <Select
                label="Profile visibility"
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...current,
                    visibility: event.target.value as BusinessProfile["visibility"]
                  }))
                }
                value={profileForm.visibility}
              >
                <option value="public">Public</option>
                <option value="connections">Connections only</option>
                <option value="private">Private</option>
              </Select>
              <Select
                label="Operating status"
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...current,
                    operatingStatus: event.target.value as BusinessProfile["operatingStatus"]
                  }))
                }
                value={profileForm.operatingStatus}
              >
                <option value="active">Active</option>
                <option value="busy">Busy</option>
                <option value="paused">Paused</option>
              </Select>
            </div>
            <div className="form-actions">
              <Button type="submit">Save profile</Button>
            </div>
          </form>
        </Card>

        <Card>
          <p className="eyebrow">Network preferences</p>
          <form
            className="form-stack"
            onSubmit={(event) => {
              event.preventDefault();
              setPreferencesMessage(updateNetworkPreferences(preferencesForm).message);
            }}
          >
            {preferencesMessage ? <div className="notice">{preferencesMessage}</div> : null}
            <div className="form-grid">
              <Select
                label="Allow discovery"
                onChange={(event) =>
                  setPreferencesForm((current) => ({
                    ...current,
                    allowDiscovery: event.target.value === "true"
                  }))
                }
                value={String(preferencesForm.allowDiscovery)}
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </Select>
              <Select
                label="Allow connection requests"
                onChange={(event) =>
                  setPreferencesForm((current) => ({
                    ...current,
                    allowConnectionRequests: event.target.value === "true"
                  }))
                }
                value={String(preferencesForm.allowConnectionRequests)}
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </Select>
              <Select
                label="Default profile visibility"
                onChange={(event) =>
                  setPreferencesForm((current) => ({
                    ...current,
                    defaultProfileVisibility: event.target.value as NetworkPreference["defaultProfileVisibility"]
                  }))
                }
                value={preferencesForm.defaultProfileVisibility}
              >
                <option value="public">Public</option>
                <option value="connections">Connections only</option>
                <option value="private">Private</option>
              </Select>
              <Select
                label="Default catalog visibility"
                onChange={(event) =>
                  setPreferencesForm((current) => ({
                    ...current,
                    defaultCatalogVisibility: event.target.value as NetworkPreference["defaultCatalogVisibility"]
                  }))
                }
                value={preferencesForm.defaultCatalogVisibility}
              >
                <option value="public">Public</option>
                <option value="connections">Connections only</option>
                <option value="private">Private</option>
              </Select>
              <Select
                label="Share contact details"
                onChange={(event) =>
                  setPreferencesForm((current) => ({
                    ...current,
                    shareContactDetails: event.target.value === "true"
                  }))
                }
                value={String(preferencesForm.shareContactDetails)}
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </Select>
              <Select
                label="Share branch summary"
                onChange={(event) =>
                  setPreferencesForm((current) => ({
                    ...current,
                    shareBranchSummary: event.target.value === "true"
                  }))
                }
                value={String(preferencesForm.shareBranchSummary)}
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </Select>
            </div>
            <div className="form-actions">
              <Button type="submit">Save preferences</Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
