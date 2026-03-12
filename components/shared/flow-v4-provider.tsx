"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { addDays } from "@/lib/calculations";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { useFlowV3 } from "@/components/shared/flow-v3-provider";
import {
  getConnectionForBusiness as getConnectionRecordForBusiness,
  getCurrentBusinessProfileId,
  getNetworkSummary,
  getRelationshipTimeline,
  getReorderSuggestions,
  getSupplierActivitySummary,
  getTrustIndicators,
  getVisibleBusinessProfiles,
  getVisibleCatalogs,
  mergeNetworkAuditLogs
} from "@/lib/v4-calculations";
import {
  createEmptyFlowV4State,
  seedFlowV4State,
  upgradeFlowV4State
} from "@/lib/v4-seed";
import {
  loadFlowV4State,
  loadRemoteFlowV4State,
  queueFlowV4StateSave,
  saveFlowV4State
} from "@/lib/v4-storage";
import {
  BusinessConnection,
  BusinessProfile,
  CatalogAvailability,
  ConnectionRole,
  FlowV4State,
  NetworkNotification,
  NetworkPreference,
  NetworkPurchaseOrder,
  NetworkRFQ,
  NetworkRFQRecipient,
  NetworkRFQResponse,
  PurchaseOrderLineItem,
  RFQLineItem,
  RFQResponseLineItem,
  RelationshipActivity,
  SupplierCatalog,
  SupplierCatalogItem,
  SupplierBusinessLink
} from "@/lib/v4-types";

interface BusinessProfilePayload {
  displayName: string;
  businessType: BusinessProfile["businessType"];
  city: string;
  country: string;
  about?: string;
  email?: string;
  phone?: string;
  logoDataUrl?: string;
  visibility: BusinessProfile["visibility"];
  operatingStatus: BusinessProfile["operatingStatus"];
  productsSummary?: string;
}

interface NetworkPreferencePayload {
  allowDiscovery: boolean;
  allowConnectionRequests: boolean;
  defaultProfileVisibility: NetworkPreference["defaultProfileVisibility"];
  defaultCatalogVisibility: NetworkPreference["defaultCatalogVisibility"];
  shareContactDetails: boolean;
  shareBranchSummary: boolean;
}

interface ConnectionPayload {
  relationshipType: ConnectionRole;
  notes?: string;
}

interface CatalogPayload {
  title: string;
  description?: string;
  visibility: SupplierCatalog["visibility"];
  status: SupplierCatalog["status"];
}

interface CatalogItemPayload {
  sourceItemId?: string;
  name: string;
  description?: string;
  price: number;
  unit: string;
  category?: string;
  availability: CatalogAvailability;
}

interface PurchaseOrderPayload {
  supplierBusinessId: string;
  issueDate: string;
  expectedDate?: string;
  notes?: string;
  instructions?: string;
  branchId?: string;
  sourceCatalogId?: string;
  lineItems: PurchaseOrderLineItem[];
}

interface RFQPayload {
  title: string;
  dueDate?: string;
  notes?: string;
  branchId?: string;
  supplierBusinessIds: string[];
  lineItems: RFQLineItem[];
}

interface RFQResponsePayload {
  notes?: string;
  leadTimeDays?: number;
  lineItems: RFQResponseLineItem[];
}

interface FlowV4ContextValue {
  isHydrated: boolean;
  currentBusinessId?: string;
  currentBusinessProfile?: BusinessProfile;
  networkPreferences?: NetworkPreference;
  businessProfiles: BusinessProfile[];
  discoverableBusinesses: BusinessProfile[];
  connections: BusinessConnection[];
  incomingConnectionRequests: BusinessConnection[];
  outgoingConnectionRequests: BusinessConnection[];
  acceptedConnections: BusinessConnection[];
  bookmarkedBusinessIds: string[];
  visibleCatalogs: SupplierCatalog[];
  catalogs: SupplierCatalog[];
  catalogItems: SupplierCatalogItem[];
  purchaseOrders: NetworkPurchaseOrder[];
  outgoingPurchaseOrders: NetworkPurchaseOrder[];
  incomingPurchaseOrders: NetworkPurchaseOrder[];
  rfqs: NetworkRFQ[];
  outgoingRFQs: NetworkRFQ[];
  rfqRecipients: NetworkRFQRecipient[];
  incomingRFQRecipients: NetworkRFQRecipient[];
  rfqResponses: NetworkRFQResponse[];
  networkSummary: ReturnType<typeof getNetworkSummary>;
  networkNotifications: NetworkNotification[];
  unreadNetworkCount: number;
  networkAuditLogs: ReturnType<typeof mergeNetworkAuditLogs>;
  reorderSuggestions: ReturnType<typeof getReorderSuggestions>;
  supplierActivitySummary: ReturnType<typeof getSupplierActivitySummary>;
  getBusinessProfile: (businessId: string) => BusinessProfile | undefined;
  getConnectionForBusiness: (businessId: string) => BusinessConnection | undefined;
  getBusinessCatalogs: (businessId: string) => SupplierCatalog[];
  getCatalogItems: (catalogId: string) => SupplierCatalogItem[];
  getTrustMetrics: (businessId: string) => ReturnType<typeof getTrustIndicators>;
  getRelationshipTimelineForBusiness: (businessId: string) => ReturnType<typeof getRelationshipTimeline>;
  getSupplierLinkForSupplier: (supplierId: string) => SupplierBusinessLink | undefined;
  toggleBookmark: (businessId: string) => { success: boolean; message: string };
  updateBusinessProfile: (payload: BusinessProfilePayload) => { success: boolean; message: string };
  updateNetworkPreferences: (payload: NetworkPreferencePayload) => { success: boolean; message: string };
  sendConnectionRequest: (businessId: string, payload: ConnectionPayload) => { success: boolean; message: string; id?: string };
  respondToConnectionRequest: (connectionId: string, status: "accepted" | "rejected", note?: string) => { success: boolean; message: string };
  disconnectBusiness: (connectionId: string) => { success: boolean; message: string };
  updateConnectionNotes: (connectionId: string, notes: string) => { success: boolean; message: string };
  linkSupplierToBusiness: (supplierId: string, businessId: string) => { success: boolean; message: string };
  saveCatalog: (payload: CatalogPayload, catalogId?: string) => { success: boolean; message: string; id?: string };
  saveCatalogItem: (catalogId: string, payload: CatalogItemPayload, catalogItemId?: string) => { success: boolean; message: string; id?: string };
  archiveCatalog: (catalogId: string) => { success: boolean; message: string };
  archiveCatalogItem: (catalogItemId: string) => { success: boolean; message: string };
  createPurchaseOrder: (payload: PurchaseOrderPayload) => { success: boolean; message: string; id?: string };
  updatePurchaseOrderStatus: (orderId: string, status: NetworkPurchaseOrder["status"], note?: string) => { success: boolean; message: string };
  convertPurchaseOrderToPurchase: (orderId: string) => { success: boolean; message: string; id?: string };
  createRFQ: (payload: RFQPayload) => { success: boolean; message: string; id?: string };
  respondToRFQ: (rfqId: string, recipientId: string, payload: RFQResponsePayload) => { success: boolean; message: string; id?: string };
  acceptRFQResponse: (responseId: string) => { success: boolean; message: string; id?: string };
  reorderFromPurchaseOrder: (orderId: string) => { success: boolean; message: string; id?: string };
  reorderFromPurchaseRecord: (purchaseId: string) => { success: boolean; message: string; id?: string };
  markNetworkNotificationRead: (notificationId: string) => void;
  markAllNetworkNotificationsRead: () => void;
  resetV4DemoState: () => void;
}

const FlowV4Context = createContext<FlowV4ContextValue | undefined>(undefined);

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function createTimestamp() {
  return new Date().toISOString();
}

function createReference(prefix: string, count: number) {
  return `${prefix}-${new Date().getFullYear()}-${String(count).padStart(3, "0")}`;
}

function defaultNetworkPreference(workspaceId: string): NetworkPreference {
  const now = createTimestamp();
  return {
    workspaceId,
    allowDiscovery: true,
    allowConnectionRequests: true,
    defaultProfileVisibility: "public",
    defaultCatalogVisibility: "connections",
    shareContactDetails: true,
    shareBranchSummary: true,
    createdAt: now,
    updatedAt: now
  };
}

export function FlowV4Provider({ children }: { children: React.ReactNode }) {
  const {
    canAccess,
    currentRole,
    currentUser,
    currentWorkspace,
    markAllNotificationsRead,
    savePurchase,
    saveSupplier,
    workspaceData
  } = useBusinessOS();
  const { branches } = useFlowV3();
  const [state, setState] = useState<FlowV4State>(createEmptyFlowV4State);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isRemoteStateReady, setIsRemoteStateReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loaded = loadFlowV4State();
    setState(upgradeFlowV4State(loaded || seedFlowV4State));
    setIsHydrated(true);

    void loadRemoteFlowV4State().then((remoteState) => {
      if (!isMounted) {
        return;
      }

      if (remoteState) {
        setState(upgradeFlowV4State(remoteState));
      }

      setIsRemoteStateReady(true);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated || !isRemoteStateReady) {
      return;
    }

    saveFlowV4State(state);
    queueFlowV4StateSave(state);
  }, [isHydrated, isRemoteStateReady, state]);

  const currentBusinessId = getCurrentBusinessProfileId(currentWorkspace?.id);

  useEffect(() => {
    if (!isHydrated || !currentWorkspace || !currentBusinessId) {
      return;
    }

    setState((current) => {
      let nextState = { ...current };
      const existingProfile = current.businessProfiles.find(
        (profile) => profile.id === currentBusinessId
      );
      const preference =
        current.preferences.find((record) => record.workspaceId === currentWorkspace.id) ||
        defaultNetworkPreference(currentWorkspace.id);
      const branchSummary = preference.shareBranchSummary
        ? branches
            .filter((branch) => branch.status === "active")
            .map((branch) => branch.name)
            .join(", ")
        : undefined;
      const baseProfile: BusinessProfile = {
        id: currentBusinessId,
        workspaceId: currentWorkspace.id,
        displayName: currentWorkspace.name,
        businessType:
          currentWorkspace.category === "trading"
            ? "distributor"
            : currentWorkspace.category,
        city: currentWorkspace.address?.split(",")[1]?.trim() || "Harare",
        country: "Zimbabwe",
        about:
          existingProfile?.about ||
          "Growing SME using Novoriq Flow to run operations and connect with suppliers and buyers.",
        email: currentWorkspace.email,
        phone: currentWorkspace.phone,
        logoDataUrl: currentWorkspace.logoDataUrl,
        visibility: existingProfile?.visibility || preference.defaultProfileVisibility,
        operatingStatus: existingProfile?.operatingStatus || "active",
        productsSummary:
          existingProfile?.productsSummary ||
          workspaceData.items
            .slice(0, 3)
            .map((item) => item.name)
            .join(", "),
        branchSummary,
        trustedBadgeReady: false,
        createdAt: existingProfile?.createdAt || createTimestamp(),
        updatedAt: createTimestamp()
      };

      nextState.businessProfiles = existingProfile
        ? current.businessProfiles.map((profile) =>
            profile.id === currentBusinessId ? baseProfile : profile
          )
        : [baseProfile, ...current.businessProfiles];

      if (!current.preferences.some((record) => record.workspaceId === currentWorkspace.id)) {
        nextState.preferences = [...current.preferences, preference];
      }

      const ownCatalog =
        current.catalogs.find((catalog) => catalog.businessProfileId === currentBusinessId) || null;
      if (!ownCatalog) {
        const catalogId = createId("catalog");
        nextState.catalogs = [
          {
            id: catalogId,
            businessProfileId: currentBusinessId,
            title: `${currentWorkspace.name} Network Catalog`,
            description: "Items and services you can share with connected businesses.",
            visibility: preference.defaultCatalogVisibility,
            status: "active",
            createdAt: createTimestamp(),
            updatedAt: createTimestamp()
          },
          ...nextState.catalogs
        ];
      }

      const activeOwnCatalog =
        nextState.catalogs.find((catalog) => catalog.businessProfileId === currentBusinessId) ||
        ownCatalog;
      if (activeOwnCatalog) {
        const missingCatalogItems = workspaceData.items.filter(
          (item) =>
            !nextState.catalogItems.some(
              (catalogItem) =>
                catalogItem.catalogId === activeOwnCatalog.id &&
                catalogItem.sourceItemId === item.id
            )
        );
        if (missingCatalogItems.length) {
          nextState.catalogItems = [
            ...missingCatalogItems.map((item) => ({
              id: createId("catalog-item"),
              catalogId: activeOwnCatalog.id,
              sourceItemId: item.id,
              name: item.name,
              description: item.description,
              price: item.sellingPrice,
              unit: item.kind === "service" ? "service" : "unit",
              category: item.category,
              availability: "available" as const,
              createdAt: createTimestamp(),
              updatedAt: createTimestamp()
            })),
            ...nextState.catalogItems
          ];
        }
      }

      const autoLinks = workspaceData.suppliers
        .filter(
          (supplier) =>
            !nextState.supplierLinks.some((link) => link.supplierId === supplier.id)
        )
        .map((supplier) => {
          const matchedProfile = nextState.businessProfiles.find(
            (profile) =>
              profile.id !== currentBusinessId &&
              (profile.displayName.toLowerCase() === supplier.name.toLowerCase() ||
                (profile.email && supplier.email && profile.email === supplier.email))
          );

          return matchedProfile
            ? {
                id: createId("supplier-link"),
                workspaceId: currentWorkspace.id,
                supplierId: supplier.id,
                businessProfileId: matchedProfile.id,
                createdAt: createTimestamp(),
                updatedAt: createTimestamp()
              }
            : undefined;
        })
        .filter(Boolean) as SupplierBusinessLink[];

      if (autoLinks.length) {
        nextState.supplierLinks = [...autoLinks, ...nextState.supplierLinks];
      }

      return nextState;
    });
  }, [branches, currentBusinessId, currentWorkspace, isHydrated, workspaceData.items, workspaceData.suppliers]);

  const currentBusinessProfile = useMemo(
    () => state.businessProfiles.find((profile) => profile.id === currentBusinessId),
    [currentBusinessId, state.businessProfiles]
  );
  const networkPreferences = useMemo(
    () =>
      currentWorkspace
        ? state.preferences.find((record) => record.workspaceId === currentWorkspace.id)
        : undefined,
    [currentWorkspace, state.preferences]
  );
  const discoverableBusinesses = useMemo(() => {
    const visible = getVisibleBusinessProfiles({
      profiles: state.businessProfiles,
      currentBusinessId,
      connections: state.connections
    }).filter((profile) => profile.id !== currentBusinessId);
    const bookmarkIds = new Set(
      state.bookmarks
        .filter((bookmark) => bookmark.workspaceId === currentWorkspace?.id)
        .map((bookmark) => bookmark.businessProfileId)
    );
    return visible.sort((left, right) => {
      const leftScore = Number(bookmarkIds.has(left.id));
      const rightScore = Number(bookmarkIds.has(right.id));
      return rightScore - leftScore || left.displayName.localeCompare(right.displayName);
    });
  }, [currentBusinessId, currentWorkspace?.id, state.bookmarks, state.businessProfiles, state.connections]);
  const bookmarkedBusinessIds = useMemo(
    () =>
      state.bookmarks
        .filter((bookmark) => bookmark.workspaceId === currentWorkspace?.id)
        .map((bookmark) => bookmark.businessProfileId),
    [currentWorkspace?.id, state.bookmarks]
  );
  const visibleCatalogs = useMemo(
    () =>
      getVisibleCatalogs({
        catalogs: state.catalogs,
        profiles: state.businessProfiles,
        currentBusinessId,
        connections: state.connections
      }),
    [currentBusinessId, state.businessProfiles, state.catalogs, state.connections]
  );
  const acceptedConnections = useMemo(
    () =>
      state.connections.filter(
        (connection) =>
          connection.status === "accepted" &&
          (connection.requesterBusinessId === currentBusinessId ||
            connection.recipientBusinessId === currentBusinessId)
      ),
    [currentBusinessId, state.connections]
  );
  const incomingConnectionRequests = useMemo(
    () =>
      state.connections.filter(
        (connection) =>
          connection.status === "pending" &&
          connection.recipientBusinessId === currentBusinessId
      ),
    [currentBusinessId, state.connections]
  );
  const outgoingConnectionRequests = useMemo(
    () =>
      state.connections.filter(
        (connection) =>
          connection.status === "pending" &&
          connection.requesterBusinessId === currentBusinessId
      ),
    [currentBusinessId, state.connections]
  );
  const outgoingPurchaseOrders = useMemo(
    () =>
      state.purchaseOrders.filter((order) => order.buyerBusinessId === currentBusinessId),
    [currentBusinessId, state.purchaseOrders]
  );
  const incomingPurchaseOrders = useMemo(
    () =>
      state.purchaseOrders.filter((order) => order.supplierBusinessId === currentBusinessId),
    [currentBusinessId, state.purchaseOrders]
  );
  const outgoingRFQs = useMemo(
    () => state.rfqs.filter((rfq) => rfq.requesterBusinessId === currentBusinessId),
    [currentBusinessId, state.rfqs]
  );
  const incomingRFQRecipients = useMemo(
    () =>
      state.rfqRecipients.filter(
        (recipient) => recipient.supplierBusinessId === currentBusinessId
      ),
    [currentBusinessId, state.rfqRecipients]
  );
  const networkSummary = useMemo(
    () =>
      getNetworkSummary({
        currentBusinessId,
        connections: state.connections,
        purchaseOrders: state.purchaseOrders,
        rfqs: state.rfqs,
        rfqRecipients: state.rfqRecipients,
        notifications: state.networkNotifications,
        bookmarks: state.bookmarks.filter((bookmark) => bookmark.workspaceId === currentWorkspace?.id)
      }),
    [currentBusinessId, currentWorkspace?.id, state.bookmarks, state.connections, state.networkNotifications, state.purchaseOrders, state.rfqRecipients, state.rfqs]
  );
  const networkNotifications = useMemo(
    () =>
      currentWorkspace
        ? state.networkNotifications.filter(
            (notification) =>
              notification.workspaceId === currentWorkspace.id &&
              (!notification.visibleToRoles ||
                !currentRole ||
                notification.visibleToRoles.includes(currentRole))
          )
        : [],
    [currentRole, currentWorkspace, state.networkNotifications]
  );
  const unreadNetworkCount = networkNotifications.filter((notification) => !notification.isRead).length;
  const networkAuditLogs = useMemo(
    () =>
      mergeNetworkAuditLogs(
        workspaceData.auditLogs,
        currentWorkspace
          ? state.networkAuditLogs.filter((log) => log.workspaceId === currentWorkspace.id)
          : []
      ),
    [currentWorkspace, state.networkAuditLogs, workspaceData.auditLogs]
  );
  const reorderSuggestions = useMemo(
    () =>
      getReorderSuggestions({
        currentBusinessId,
        purchaseOrders: state.purchaseOrders,
        purchases: workspaceData.purchases,
        supplierLinks: state.supplierLinks.filter((link) => link.workspaceId === currentWorkspace?.id),
        profiles: state.businessProfiles
      }),
    [currentBusinessId, currentWorkspace?.id, state.businessProfiles, state.purchaseOrders, state.supplierLinks, workspaceData.purchases]
  );
  const supplierActivitySummary = useMemo(
    () =>
      getSupplierActivitySummary({
        profiles: discoverableBusinesses,
        purchaseOrders: state.purchaseOrders,
        rfqResponses: state.rfqResponses
      }),
    [discoverableBusinesses, state.purchaseOrders, state.rfqResponses]
  );

  function ensureContext() {
    if (!currentWorkspace || !currentUser || !currentRole || !currentBusinessId) {
      return { ok: false as const, message: "Workspace network context is not ready." };
    }

    return {
      ok: true as const,
      workspaceId: currentWorkspace.id,
      userId: currentUser.id,
      role: currentRole,
      businessId: currentBusinessId
    };
  }

  function appendNetworkArtifacts(params: {
    notification?: NetworkNotification;
    activity?: {
      businessProfileId: string;
      type: RelationshipActivity["type"];
      title: string;
      message: string;
      href?: string;
      connectionId?: string;
    };
    audit?: FlowV4State["networkAuditLogs"][number];
  }) {
    return (current: FlowV4State): FlowV4State => ({
      ...current,
      relationshipActivities: params.activity
        ? [
            {
              id: createId("network-activity"),
              workspaceId: params.audit?.workspaceId || current.preferences[0]?.workspaceId || "workspace",
              businessProfileId: params.activity.businessProfileId,
              connectionId: params.activity.connectionId,
              type: params.activity.type,
              title: params.activity.title,
              message: params.activity.message,
              href: params.activity.href,
              createdAt: createTimestamp()
            },
            ...current.relationshipActivities
          ]
        : current.relationshipActivities,
      networkNotifications: params.notification
        ? [params.notification, ...current.networkNotifications]
        : current.networkNotifications,
      networkAuditLogs: params.audit
        ? [params.audit, ...current.networkAuditLogs]
        : current.networkAuditLogs
    });
  }

  function getBusinessProfile(businessId: string) {
    return state.businessProfiles.find((profile) => profile.id === businessId);
  }

  function getConnectionForBusiness(businessId: string) {
    return getConnectionRecordForBusiness(state.connections, currentBusinessId, businessId);
  }

  function getBusinessCatalogs(businessId: string) {
    return visibleCatalogs.filter((catalog) => catalog.businessProfileId === businessId);
  }

  function getCatalogItems(catalogId: string) {
    return state.catalogItems.filter((item) => item.catalogId === catalogId);
  }

  function getTrustMetrics(businessId: string) {
    return getTrustIndicators({
      businessId,
      profiles: state.businessProfiles,
      connections: state.connections,
      purchaseOrders: state.purchaseOrders,
      rfqRecipients: state.rfqRecipients,
      rfqResponses: state.rfqResponses
    });
  }

  function getRelationshipTimelineForBusiness(businessId: string) {
    return getRelationshipTimeline({
      currentBusinessId,
      businessId,
      connections: state.connections,
      purchaseOrders: state.purchaseOrders,
      rfqs: state.rfqs,
      rfqRecipients: state.rfqRecipients,
      rfqResponses: state.rfqResponses,
      relationshipActivities: state.relationshipActivities
    });
  }

  function getSupplierLinkForSupplier(supplierId: string) {
    return state.supplierLinks.find(
      (link) => link.workspaceId === currentWorkspace?.id && link.supplierId === supplierId
    );
  }

  const toggleBookmark = (businessId: string) => {
    const context = ensureContext();
    if (!context.ok || !canAccess("view_network")) {
      return { success: false, message: "You do not have access to the business network." };
    }

    const existing = state.bookmarks.find(
      (bookmark) =>
        bookmark.workspaceId === context.workspaceId && bookmark.businessProfileId === businessId
    );
    setState((current) => ({
      ...current,
      bookmarks: existing
        ? current.bookmarks.filter((bookmark) => bookmark.id !== existing.id)
        : [
            {
              id: createId("bookmark"),
              workspaceId: context.workspaceId,
              businessProfileId: businessId,
              createdAt: createTimestamp()
            },
            ...current.bookmarks
          ],
      networkAuditLogs: [
        {
          id: createId("network-audit"),
          workspaceId: context.workspaceId,
          entityType: "business_profile",
          entityId: businessId,
          action: "bookmarked",
          actorUserId: context.userId,
          actorRole: context.role,
          title: existing ? "Business bookmark removed" : "Business bookmarked",
          summary: existing
            ? "Removed a bookmarked network business."
            : "Saved a supplier or buyer to revisit later.",
          createdAt: createTimestamp()
        },
        ...current.networkAuditLogs
      ]
    }));
    return {
      success: true,
      message: existing ? "Bookmark removed." : "Business bookmarked."
    };
  };

  const updateBusinessProfile = (payload: BusinessProfilePayload) => {
    const context = ensureContext();
    if (!context.ok || !canAccess("manage_network_profile")) {
      return { success: false, message: "You do not have access to manage the network profile." };
    }

    setState((current) => ({
      ...current,
      businessProfiles: current.businessProfiles.map((profile) =>
        profile.id === context.businessId
          ? {
              ...profile,
              ...payload,
              displayName: payload.displayName.trim(),
              city: payload.city.trim(),
              country: payload.country.trim(),
              about: payload.about?.trim(),
              email: payload.email?.trim(),
              phone: payload.phone?.trim(),
              productsSummary: payload.productsSummary?.trim(),
              updatedAt: createTimestamp()
            }
          : profile
      ),
      networkAuditLogs: [
        {
          id: createId("network-audit"),
          workspaceId: context.workspaceId,
          entityType: "business_profile",
          entityId: context.businessId,
          action: "edited",
          actorUserId: context.userId,
          actorRole: context.role,
          title: "Business network profile updated",
          summary: "Public network identity and visibility settings were changed.",
          createdAt: createTimestamp()
        },
        ...current.networkAuditLogs
      ]
    }));
    return { success: true, message: "Business network profile updated." };
  };

  const updateNetworkPreferences = (payload: NetworkPreferencePayload) => {
    const context = ensureContext();
    if (!context.ok || !canAccess("manage_network_profile")) {
      return { success: false, message: "You do not have access to change network settings." };
    }

    setState((current) => ({
      ...current,
      preferences: current.preferences.some((record) => record.workspaceId === context.workspaceId)
        ? current.preferences.map((record) =>
            record.workspaceId === context.workspaceId
              ? { ...record, ...payload, updatedAt: createTimestamp() }
              : record
          )
        : [
            {
              workspaceId: context.workspaceId,
              ...payload,
              createdAt: createTimestamp(),
              updatedAt: createTimestamp()
            },
            ...current.preferences
          ],
      networkAuditLogs: [
        {
          id: createId("network-audit"),
          workspaceId: context.workspaceId,
          entityType: "network_settings",
          entityId: context.workspaceId,
          action: "edited",
          actorUserId: context.userId,
          actorRole: context.role,
          title: "Network preferences updated",
          summary: "Discovery, connection, and catalog-sharing preferences were changed.",
          createdAt: createTimestamp()
        },
        ...current.networkAuditLogs
      ]
    }));
    return { success: true, message: "Network preferences updated." };
  };

  const sendConnectionRequest = (businessId: string, payload: ConnectionPayload) => {
    const context = ensureContext();
    if (!context.ok || !canAccess("manage_connections")) {
      return { success: false, message: "You do not have access to manage connections." };
    }

    if (businessId === context.businessId) {
      return { success: false, message: "You cannot connect your business to itself." };
    }

    if (getConnectionForBusiness(businessId)) {
      return { success: false, message: "A connection already exists for this business." };
    }

    const connectionId = createId("connection");
    setState((current) => ({
      ...appendNetworkArtifacts({
        notification: {
          id: createId("network-note"),
          workspaceId: context.workspaceId,
          type: "relationship_activity",
          title: "Connection request sent",
          message: `Sent a ${payload.relationshipType} request to ${
            current.businessProfiles.find((profile) => profile.id === businessId)?.displayName ||
            "business"
          }.`,
          href: "/app/network/connections",
          relatedBusinessId: businessId,
          isRead: false,
          createdAt: createTimestamp()
        },
        activity: {
          businessProfileId: businessId,
          connectionId,
          type: "connection",
          title: "Connection request sent",
          message: "A new business connection request is pending.",
          href: "/app/network/connections"
        },
        audit: {
          id: createId("network-audit"),
          workspaceId: context.workspaceId,
          entityType: "business_connection",
          entityId: connectionId,
          action: "sent",
          actorUserId: context.userId,
          actorRole: context.role,
          title: "Business connection request sent",
          summary: "Sent a new supplier or buyer connection request.",
          createdAt: createTimestamp()
        }
      })(current),
      connections: [
        {
          id: connectionId,
          workspaceId: context.workspaceId,
          requesterBusinessId: context.businessId,
          recipientBusinessId: businessId,
          status: "pending",
          relationshipType: payload.relationshipType,
          notes: payload.notes?.trim(),
          createdAt: createTimestamp(),
          updatedAt: createTimestamp()
        },
        ...current.connections
      ]
    }));

    return { success: true, message: "Connection request sent.", id: connectionId };
  };

  const respondToConnectionRequest = (
    connectionId: string,
    status: "accepted" | "rejected",
    note?: string
  ) => {
    const context = ensureContext();
    if (!context.ok || !canAccess("manage_connections")) {
      return { success: false, message: "You do not have access to respond to connections." };
    }

    const connection = state.connections.find((entry) => entry.id === connectionId);
    if (!connection) {
      return { success: false, message: "Connection request not found." };
    }

    setState((current) => ({
      ...appendNetworkArtifacts({
        notification: {
          id: createId("network-note"),
          workspaceId: context.workspaceId,
          type: status === "accepted" ? "connection_accepted" : "connection_rejected",
          title: status === "accepted" ? "Connection accepted" : "Connection rejected",
          message:
            note?.trim() ||
            `Connection with ${
              current.businessProfiles.find(
                (profile) =>
                  profile.id ===
                  (connection.requesterBusinessId === context.businessId
                    ? connection.recipientBusinessId
                    : connection.requesterBusinessId)
              )?.displayName || "business"
            } was ${status}.`,
          href: "/app/network/connections",
          relatedBusinessId:
            connection.requesterBusinessId === context.businessId
              ? connection.recipientBusinessId
              : connection.requesterBusinessId,
          isRead: false,
          createdAt: createTimestamp()
        },
        activity: {
          businessProfileId:
            connection.requesterBusinessId === context.businessId
              ? connection.recipientBusinessId
              : connection.requesterBusinessId,
          connectionId,
          type: "connection",
          title: status === "accepted" ? "Connection approved" : "Connection rejected",
          message: note?.trim() || "The connection status changed.",
          href: "/app/network/connections"
        },
        audit: {
          id: createId("network-audit"),
          workspaceId: context.workspaceId,
          entityType: "business_connection",
          entityId: connectionId,
          action: status,
          actorUserId: context.userId,
          actorRole: context.role,
          title: status === "accepted" ? "Connection accepted" : "Connection rejected",
          summary: note?.trim() || "A network connection request was resolved.",
          createdAt: createTimestamp()
        }
      })(current),
      connections: current.connections.map((entry) =>
        entry.id === connectionId
          ? {
              ...entry,
              status,
              notes: note?.trim() || entry.notes,
              respondedAt: createTimestamp(),
              updatedAt: createTimestamp()
            }
          : entry
      )
    }));
    return {
      success: true,
      message: status === "accepted" ? "Connection accepted." : "Connection rejected."
    };
  };

  const disconnectBusiness = (connectionId: string) => {
    const context = ensureContext();
    if (!context.ok || !canAccess("manage_connections")) {
      return { success: false, message: "You do not have access to disconnect businesses." };
    }

    const connection = state.connections.find((entry) => entry.id === connectionId);
    if (!connection) {
      return { success: false, message: "Connection not found." };
    }

    const targetBusinessId =
      connection.requesterBusinessId === context.businessId
        ? connection.recipientBusinessId
        : connection.requesterBusinessId;

    setState((current) => ({
      ...appendNetworkArtifacts({
        activity: {
          businessProfileId: targetBusinessId,
          connectionId,
          type: "connection",
          title: "Connection disconnected",
          message: "The explicit business relationship was removed.",
          href: "/app/network/connections"
        },
        audit: {
          id: createId("network-audit"),
          workspaceId: context.workspaceId,
          entityType: "business_connection",
          entityId: connectionId,
          action: "disconnected",
          actorUserId: context.userId,
          actorRole: context.role,
          title: "Business disconnected",
          summary: "Removed a supplier or buyer network relationship.",
          createdAt: createTimestamp()
        }
      })(current),
      connections: current.connections.map((entry) =>
        entry.id === connectionId
          ? { ...entry, status: "disconnected", updatedAt: createTimestamp() }
          : entry
      )
    }));
    return { success: true, message: "Business disconnected." };
  };

  const updateConnectionNotes = (connectionId: string, notes: string) => {
    const context = ensureContext();
    if (!context.ok || !canAccess("manage_connections")) {
      return { success: false, message: "You do not have access to update relationship notes." };
    }

    setState((current) => ({
      ...current,
      connections: current.connections.map((entry) =>
        entry.id === connectionId
          ? { ...entry, notes: notes.trim(), updatedAt: createTimestamp() }
          : entry
      )
    }));
    return { success: true, message: "Relationship notes updated." };
  };

  const linkSupplierToBusiness = (supplierId: string, businessId: string) => {
    const context = ensureContext();
    if (!context.ok || !canAccess("manage_connections")) {
      return { success: false, message: "You do not have access to link suppliers." };
    }

    setState((current) => {
      const existing = current.supplierLinks.find(
        (link) => link.workspaceId === context.workspaceId && link.supplierId === supplierId
      );
      return {
        ...current,
        supplierLinks: existing
          ? current.supplierLinks.map((link) =>
              link.id === existing.id
                ? { ...link, businessProfileId: businessId, updatedAt: createTimestamp() }
                : link
            )
          : [
              {
                id: createId("supplier-link"),
                workspaceId: context.workspaceId,
                supplierId,
                businessProfileId: businessId,
                createdAt: createTimestamp(),
                updatedAt: createTimestamp()
              },
              ...current.supplierLinks
            ]
      };
    });
    return { success: true, message: "Supplier linked to network business." };
  };

  const saveCatalog = (payload: CatalogPayload, catalogId?: string) => {
    const context = ensureContext();
    if (!context.ok || !canAccess("manage_catalogs")) {
      return { success: false, message: "You do not have access to manage catalogs." };
    }

    const id = catalogId || createId("catalog");
    setState((current) => ({
      ...appendNetworkArtifacts({
        notification: {
          id: createId("network-note"),
          workspaceId: context.workspaceId,
          type: "catalog_updated",
          title: catalogId ? "Catalog updated" : "Catalog published",
          message: catalogId
            ? `${payload.title.trim()} was updated.`
            : `${payload.title.trim()} is now available in the business network.`,
          href: `/app/network/catalogs/${id}`,
          relatedEntityId: id,
          isRead: false,
          createdAt: createTimestamp()
        },
        activity: {
          businessProfileId: context.businessId,
          type: "catalog",
          title: catalogId ? "Catalog updated" : "Catalog created",
          message: payload.title.trim(),
          href: `/app/network/catalogs/${id}`
        },
        audit: {
          id: createId("network-audit"),
          workspaceId: context.workspaceId,
          entityType: "supplier_catalog",
          entityId: id,
          action: catalogId ? "edited" : "created",
          actorUserId: context.userId,
          actorRole: context.role,
          title: catalogId ? "Supplier catalog updated" : "Supplier catalog created",
          summary: payload.title.trim(),
          createdAt: createTimestamp()
        }
      })(current),
      catalogs: current.catalogs.some((catalog) => catalog.id === id)
        ? current.catalogs.map((catalog) =>
            catalog.id === id
              ? {
                  ...catalog,
                  title: payload.title.trim(),
                  description: payload.description?.trim(),
                  visibility: payload.visibility,
                  status: payload.status,
                  updatedAt: createTimestamp()
                }
              : catalog
          )
        : [
            {
              id,
              businessProfileId: context.businessId,
              title: payload.title.trim(),
              description: payload.description?.trim(),
              visibility: payload.visibility,
              status: payload.status,
              createdAt: createTimestamp(),
              updatedAt: createTimestamp()
            },
            ...current.catalogs
          ]
    }));
    return { success: true, message: catalogId ? "Catalog updated." : "Catalog created.", id };
  };

  const saveCatalogItem = (
    catalogId: string,
    payload: CatalogItemPayload,
    catalogItemId?: string
  ) => {
    const context = ensureContext();
    if (!context.ok || !canAccess("manage_catalogs")) {
      return { success: false, message: "You do not have access to manage catalog items." };
    }

    const id = catalogItemId || createId("catalog-item");
    setState((current) => ({
      ...current,
      catalogItems: current.catalogItems.some((item) => item.id === id)
        ? current.catalogItems.map((item) =>
            item.id === id
              ? {
                  ...item,
                  ...payload,
                  name: payload.name.trim(),
                  description: payload.description?.trim(),
                  unit: payload.unit.trim(),
                  category: payload.category?.trim(),
                  updatedAt: createTimestamp()
                }
              : item
          )
        : [
            {
              id,
              catalogId,
              ...payload,
              name: payload.name.trim(),
              description: payload.description?.trim(),
              unit: payload.unit.trim(),
              category: payload.category?.trim(),
              createdAt: createTimestamp(),
              updatedAt: createTimestamp()
            },
            ...current.catalogItems
          ],
      networkAuditLogs: [
        {
          id: createId("network-audit"),
          workspaceId: context.workspaceId,
          entityType: "catalog_item",
          entityId: id,
          action: catalogItemId ? "edited" : "created",
          actorUserId: context.userId,
          actorRole: context.role,
          title: catalogItemId ? "Catalog item updated" : "Catalog item added",
          summary: payload.name.trim(),
          createdAt: createTimestamp()
        },
        ...current.networkAuditLogs
      ]
    }));
    return {
      success: true,
      message: catalogItemId ? "Catalog item updated." : "Catalog item added.",
      id
    };
  };

  const archiveCatalog = (catalogId: string) => {
    const context = ensureContext();
    if (!context.ok || !canAccess("manage_catalogs")) {
      return { success: false, message: "You do not have access to archive catalogs." };
    }

    setState((current) => ({
      ...current,
      catalogs: current.catalogs.map((catalog) =>
        catalog.id === catalogId
          ? { ...catalog, status: "archived", updatedAt: createTimestamp() }
          : catalog
      )
    }));
    return { success: true, message: "Catalog archived." };
  };

  const archiveCatalogItem = (catalogItemId: string) => {
    const context = ensureContext();
    if (!context.ok || !canAccess("manage_catalogs")) {
      return { success: false, message: "You do not have access to archive catalog items." };
    }

    setState((current) => ({
      ...current,
      catalogItems: current.catalogItems.filter((item) => item.id !== catalogItemId)
    }));
    return { success: true, message: "Catalog item removed." };
  };

  function ensureSupplierForBusiness(
    businessId: string,
    workspaceId: string
  ): { supplierId?: string; message?: string } {
    const existingLink = state.supplierLinks.find(
      (link) => link.workspaceId === workspaceId && link.businessProfileId === businessId
    );
    if (existingLink) {
      return { supplierId: existingLink.supplierId };
    }

    const existingSupplier = workspaceData.suppliers.find((supplier) => {
      const profile = state.businessProfiles.find((entry) => entry.id === businessId);
      return profile
        ? supplier.name.toLowerCase() === profile.displayName.toLowerCase() ||
            (supplier.email && profile.email && supplier.email === profile.email)
        : false;
    });
    if (existingSupplier) {
      setState((current) => ({
        ...current,
        supplierLinks: [
          {
            id: createId("supplier-link"),
            workspaceId,
            supplierId: existingSupplier.id,
            businessProfileId: businessId,
            createdAt: createTimestamp(),
            updatedAt: createTimestamp()
          },
          ...current.supplierLinks
        ]
      }));
      return { supplierId: existingSupplier.id };
    }

    const profile = state.businessProfiles.find((entry) => entry.id === businessId);
    if (!profile) {
      return { message: "Supplier business profile not found." };
    }

    const supplierResult = saveSupplier({
      name: profile.displayName,
      email: profile.email,
      phone: profile.phone,
      address: [profile.city, profile.country].filter(Boolean).join(", "),
      notes: "Created from Novoriq Flow business network."
    });
    if (!supplierResult.success || !supplierResult.id) {
      return { message: supplierResult.message };
    }

    setState((current) => ({
      ...current,
      supplierLinks: [
        {
          id: createId("supplier-link"),
          workspaceId,
          supplierId: supplierResult.id || "",
          businessProfileId: businessId,
          createdAt: createTimestamp(),
          updatedAt: createTimestamp()
        },
        ...current.supplierLinks
      ]
    }));

    return { supplierId: supplierResult.id };
  }

  const createPurchaseOrder = (payload: PurchaseOrderPayload) => {
    const context = ensureContext();
    if (!context.ok || !canAccess("manage_purchase_orders")) {
      return { success: false, message: "You do not have access to create purchase orders." };
    }

    const supplierProfile = state.businessProfiles.find(
      (profile) => profile.id === payload.supplierBusinessId
    );
    if (!supplierProfile) {
      return { success: false, message: "Supplier business not found." };
    }

    const orderId = createId("po");
    const reference = createReference(
      "PO",
      state.purchaseOrders.filter((order) => order.workspaceId === context.workspaceId).length + 1
    );
    const now = createTimestamp();
    setState((current) => ({
      ...appendNetworkArtifacts({
        notification: {
          id: createId("network-note"),
          workspaceId: context.workspaceId,
          type: "relationship_activity",
          title: "Purchase order sent",
          message: `${reference} was sent to ${supplierProfile.displayName}.`,
          href: `/app/network/orders/${orderId}`,
          relatedBusinessId: supplierProfile.id,
          relatedEntityId: orderId,
          isRead: false,
          createdAt: now
        },
        activity: {
          businessProfileId: supplierProfile.id,
          type: "purchase_order",
          title: "Purchase order sent",
          message: `${reference} was sent to ${supplierProfile.displayName}.`,
          href: `/app/network/orders/${orderId}`
        },
        audit: {
          id: createId("network-audit"),
          workspaceId: context.workspaceId,
          entityType: "purchase_order",
          entityId: orderId,
          action: "sent",
          actorUserId: context.userId,
          actorRole: context.role,
          title: "Network purchase order sent",
          summary: `${reference} sent to ${supplierProfile.displayName}.`,
          createdAt: now
        }
      })(current),
      purchaseOrders: [
        {
          id: orderId,
          workspaceId: context.workspaceId,
          buyerBusinessId: context.businessId,
          supplierBusinessId: payload.supplierBusinessId,
          reference,
          status: "sent",
          issueDate: payload.issueDate,
          expectedDate: payload.expectedDate,
          notes: payload.notes?.trim(),
          instructions: payload.instructions?.trim(),
          branchId: payload.branchId,
          createdBy: context.userId,
          sourceCatalogId: payload.sourceCatalogId,
          lineItems: payload.lineItems.map((lineItem) => ({
            ...lineItem,
            name: lineItem.name.trim(),
            description: lineItem.description?.trim(),
            unit: lineItem.unit.trim()
          })),
          history: [
            {
              id: createId("po-history"),
              status: "sent",
              actorBusinessId: context.businessId,
              actorUserId: context.userId,
              note: payload.notes?.trim(),
              createdAt: now
            }
          ],
          createdAt: now,
          updatedAt: now
        },
        ...current.purchaseOrders
      ]
    }));
    return { success: true, message: "Purchase order sent.", id: orderId };
  };

  const updatePurchaseOrderStatus = (
    orderId: string,
    status: NetworkPurchaseOrder["status"],
    note?: string
  ) => {
    const context = ensureContext();
    if (!context.ok || !canAccess("manage_purchase_orders")) {
      return { success: false, message: "You do not have access to update purchase orders." };
    }

    const order = state.purchaseOrders.find((entry) => entry.id === orderId);
    if (!order) {
      return { success: false, message: "Purchase order not found." };
    }
    const counterpartyId =
      order.buyerBusinessId === context.businessId
        ? order.supplierBusinessId
        : order.buyerBusinessId;

    setState((current) => ({
      ...appendNetworkArtifacts({
        notification: {
          id: createId("network-note"),
          workspaceId: context.workspaceId,
          type:
            status === "accepted"
              ? "purchase_order_accepted"
              : status === "rejected"
                ? "purchase_order_rejected"
                : status === "fulfilled"
                  ? "purchase_order_fulfilled"
                  : "relationship_activity",
          title: `Purchase order ${status.replaceAll("_", " ")}`,
          message: `${order.reference} is now ${status.replaceAll("_", " ")}.`,
          href: `/app/network/orders/${order.id}`,
          relatedBusinessId: counterpartyId,
          relatedEntityId: order.id,
          isRead: false,
          createdAt: createTimestamp()
        },
        activity: {
          businessProfileId: counterpartyId,
          type: "purchase_order",
          title: `Purchase order ${status.replaceAll("_", " ")}`,
          message: `${order.reference} changed to ${status.replaceAll("_", " ")}.`,
          href: `/app/network/orders/${order.id}`
        },
        audit: {
          id: createId("network-audit"),
          workspaceId: context.workspaceId,
          entityType: "purchase_order",
          entityId: order.id,
          action:
            status === "accepted"
              ? "accepted"
              : status === "rejected"
                ? "rejected"
                : status === "fulfilled"
                  ? "fulfilled"
                  : "edited",
          actorUserId: context.userId,
          actorRole: context.role,
          title: "Purchase order status changed",
          summary: `${order.reference} is now ${status.replaceAll("_", " ")}.`,
          createdAt: createTimestamp()
        }
      })(current),
      purchaseOrders: current.purchaseOrders.map((entry) =>
        entry.id === orderId
          ? {
              ...entry,
              status,
              updatedAt: createTimestamp(),
              history: [
                ...entry.history,
                {
                  id: createId("po-history"),
                  status,
                  actorBusinessId: context.businessId,
                  actorUserId: context.userId,
                  note: note?.trim(),
                  createdAt: createTimestamp()
                }
              ]
            }
          : entry
      )
    }));

    return { success: true, message: `Purchase order marked ${status.replaceAll("_", " ")}.` };
  };

  const convertPurchaseOrderToPurchase = (orderId: string) => {
    const context = ensureContext();
    if (!context.ok || !canAccess("manage_purchases")) {
      return { success: false, message: "You do not have access to convert orders into purchases." };
    }

    const order = state.purchaseOrders.find((entry) => entry.id === orderId);
    if (!order) {
      return { success: false, message: "Purchase order not found." };
    }
    if (order.buyerBusinessId !== context.businessId) {
      return { success: false, message: "Only the buyer can convert this purchase order." };
    }
    if (order.linkedPurchaseId) {
      return { success: false, message: "This order is already linked to a purchase record." };
    }

    const supplierResult = ensureSupplierForBusiness(order.supplierBusinessId, context.workspaceId);
    if (!supplierResult.supplierId) {
      return { success: false, message: supplierResult.message || "Supplier linkage failed." };
    }

    const purchaseResult = savePurchase({
      supplierId: supplierResult.supplierId,
      purchaseDate: order.issueDate,
      dueDate:
        order.expectedDate ||
        addDays(
          new Date(order.issueDate),
          workspaceData.settings?.defaultPurchaseDueDays || 14
        ).toISOString(),
      status: "confirmed",
      lineItems: order.lineItems.map((lineItem) => ({
        id: createId("purchase-line"),
        itemId: undefined,
        name: lineItem.name,
        description: lineItem.description,
        quantity: lineItem.quantity,
        unitCost: lineItem.unitPrice
      })),
      notes: `Converted from network purchase order ${order.reference}.`
    });

    if (!purchaseResult.success || !purchaseResult.id) {
      return { success: false, message: purchaseResult.message };
    }

    setState((current) => ({
      ...appendNetworkArtifacts({
        activity: {
          businessProfileId: order.supplierBusinessId,
          type: "purchase_order",
          title: "Order converted to internal purchase",
          message: `${order.reference} now feeds the internal payable workflow.`,
          href: `/app/purchases/${purchaseResult.id}`
        },
        audit: {
          id: createId("network-audit"),
          workspaceId: context.workspaceId,
          entityType: "purchase_order",
          entityId: order.id,
          action: "confirmed",
          actorUserId: context.userId,
          actorRole: context.role,
          title: "Purchase order linked to purchase workflow",
          summary: `${order.reference} was converted into a purchase record.`,
          createdAt: createTimestamp()
        }
      })(current),
      purchaseOrders: current.purchaseOrders.map((entry) =>
        entry.id === order.id
          ? { ...entry, linkedPurchaseId: purchaseResult.id, updatedAt: createTimestamp() }
          : entry
      )
    }));

    return {
      success: true,
      message: "Purchase order converted into a purchase record.",
      id: purchaseResult.id
    };
  };

  const createRFQ = (payload: RFQPayload) => {
    const context = ensureContext();
    if (!context.ok || !canAccess("manage_rfqs")) {
      return { success: false, message: "You do not have access to create RFQs." };
    }

    if (!payload.supplierBusinessIds.length) {
      return { success: false, message: "Select at least one supplier." };
    }

    const rfqId = createId("rfq");
    const reference = createReference(
      "RFQ",
      state.rfqs.filter((rfq) => rfq.workspaceId === context.workspaceId).length + 1
    );
    const now = createTimestamp();
    const recipientIds = payload.supplierBusinessIds.map(() => createId("rfq-recipient"));

    setState((current) => ({
      ...appendNetworkArtifacts({
        notification: {
          id: createId("network-note"),
          workspaceId: context.workspaceId,
          type: "relationship_activity",
          title: "RFQ sent",
          message: `${reference} was sent to ${payload.supplierBusinessIds.length} supplier${
            payload.supplierBusinessIds.length === 1 ? "" : "s"
          }.`,
          href: `/app/network/rfqs/${rfqId}`,
          relatedEntityId: rfqId,
          isRead: false,
          createdAt: now
        },
        audit: {
          id: createId("network-audit"),
          workspaceId: context.workspaceId,
          entityType: "rfq",
          entityId: rfqId,
          action: "sent",
          actorUserId: context.userId,
          actorRole: context.role,
          title: "RFQ created and sent",
          summary: `${reference} was sent to suppliers for pricing.`,
          createdAt: now
        }
      })(current),
      rfqs: [
        {
          id: rfqId,
          workspaceId: context.workspaceId,
          requesterBusinessId: context.businessId,
          reference,
          title: payload.title.trim(),
          status: "sent",
          dueDate: payload.dueDate,
          notes: payload.notes?.trim(),
          branchId: payload.branchId,
          createdBy: context.userId,
          lineItems: payload.lineItems.map((lineItem) => ({
            ...lineItem,
            name: lineItem.name.trim(),
            description: lineItem.description?.trim(),
            unit: lineItem.unit.trim()
          })),
          recipientIds,
          createdAt: now,
          updatedAt: now
        },
        ...current.rfqs
      ],
      rfqRecipients: [
        ...payload.supplierBusinessIds.map((businessId, index) => ({
          id: recipientIds[index],
          rfqId,
          supplierBusinessId: businessId,
          status: "sent" as const,
          createdAt: now,
          updatedAt: now
        })),
        ...current.rfqRecipients
      ]
    }));

    return { success: true, message: "RFQ sent to suppliers.", id: rfqId };
  };

  const respondToRFQ = (rfqId: string, recipientId: string, payload: RFQResponsePayload) => {
    const context = ensureContext();
    if (!context.ok || !canAccess("manage_rfqs")) {
      return { success: false, message: "You do not have access to respond to RFQs." };
    }

    const recipient = state.rfqRecipients.find((entry) => entry.id === recipientId);
    if (!recipient) {
      return { success: false, message: "RFQ recipient record not found." };
    }
    if (recipient.supplierBusinessId !== context.businessId) {
      return { success: false, message: "Only the targeted supplier can respond to this RFQ." };
    }

    const existingResponse = state.rfqResponses.find(
      (response) => response.recipientId === recipientId
    );
    const responseId = existingResponse?.id || createId("rfq-response");
    setState((current) => ({
      ...appendNetworkArtifacts({
        notification: {
          id: createId("network-note"),
          workspaceId: context.workspaceId,
          type: "rfq_response_received",
          title: existingResponse ? "RFQ response updated" : "RFQ response submitted",
          message: `A supplier response was submitted for ${
            current.rfqs.find((rfq) => rfq.id === rfqId)?.reference || "RFQ"
          }.`,
          href: `/app/network/rfqs/${rfqId}`,
          relatedEntityId: rfqId,
          isRead: false,
          createdAt: createTimestamp()
        },
        activity: {
          businessProfileId: context.businessId,
          type: "rfq",
          title: existingResponse ? "RFQ response updated" : "RFQ response submitted",
          message: `Response sent for ${
            current.rfqs.find((rfq) => rfq.id === rfqId)?.reference || "RFQ"
          }.`,
          href: `/app/network/rfqs/${rfqId}`
        },
        audit: {
          id: createId("network-audit"),
          workspaceId: context.workspaceId,
          entityType: "rfq_response",
          entityId: responseId,
          action: existingResponse ? "edited" : "responded",
          actorUserId: context.userId,
          actorRole: context.role,
          title: existingResponse ? "RFQ response updated" : "RFQ response submitted",
          summary: `Supplier response recorded for ${rfqId}.`,
          createdAt: createTimestamp()
        }
      })(current),
      rfqResponses: existingResponse
        ? current.rfqResponses.map((response) =>
            response.id === responseId
              ? {
                  ...response,
                  status: "submitted",
                  notes: payload.notes?.trim(),
                  leadTimeDays: payload.leadTimeDays,
                  lineItems: payload.lineItems,
                  updatedAt: createTimestamp()
                }
              : response
          )
        : [
            {
              id: responseId,
              rfqId,
              recipientId,
              supplierBusinessId: context.businessId,
              status: "submitted",
              notes: payload.notes?.trim(),
              leadTimeDays: payload.leadTimeDays,
              lineItems: payload.lineItems,
              submittedAt: createTimestamp(),
              updatedAt: createTimestamp()
            },
            ...current.rfqResponses
          ],
      rfqRecipients: current.rfqRecipients.map((entry) =>
        entry.id === recipientId
          ? { ...entry, status: "responded", updatedAt: createTimestamp() }
          : entry
      ),
      rfqs: current.rfqs.map((rfq) =>
        rfq.id === rfqId ? { ...rfq, status: "responded", updatedAt: createTimestamp() } : rfq
      )
    }));

    return {
      success: true,
      message: existingResponse ? "RFQ response updated." : "RFQ response submitted.",
      id: responseId
    };
  };

  const acceptRFQResponse = (responseId: string) => {
    const context = ensureContext();
    if (!context.ok || !canAccess("manage_rfqs")) {
      return { success: false, message: "You do not have access to accept supplier responses." };
    }

    const response = state.rfqResponses.find((entry) => entry.id === responseId);
    if (!response) {
      return { success: false, message: "RFQ response not found." };
    }
    const rfq = state.rfqs.find((entry) => entry.id === response.rfqId);
    if (!rfq || rfq.requesterBusinessId !== context.businessId) {
      return { success: false, message: "Only the requesting business can accept this response." };
    }

    const poResult = createPurchaseOrder({
      supplierBusinessId: response.supplierBusinessId,
      issueDate: createTimestamp(),
      expectedDate: response.leadTimeDays
        ? addDays(new Date(), response.leadTimeDays).toISOString()
        : undefined,
      notes: `Converted from accepted ${rfq.reference}.`,
      instructions: rfq.notes,
      branchId: rfq.branchId,
      lineItems: response.lineItems.map((lineItem) => ({
        id: createId("po-line"),
        name: lineItem.name,
        description: lineItem.description,
        quantity: lineItem.quantity,
        unit: lineItem.unit,
        unitPrice: lineItem.unitPrice
      }))
    });
    if (!poResult.success || !poResult.id) {
      return { success: false, message: poResult.message };
    }

    setState((current) => ({
      ...appendNetworkArtifacts({
        audit: {
          id: createId("network-audit"),
          workspaceId: context.workspaceId,
          entityType: "rfq",
          entityId: rfq.id,
          action: "accepted",
          actorUserId: context.userId,
          actorRole: context.role,
          title: "RFQ response accepted",
          summary: `${rfq.reference} was accepted and converted into a purchase order.`,
          createdAt: createTimestamp()
        }
      })(current),
      rfqs: current.rfqs.map((entry) =>
        entry.id === rfq.id
          ? {
              ...entry,
              status: "accepted",
              acceptedResponseId: response.id,
              convertedPurchaseOrderId: poResult.id,
              updatedAt: createTimestamp()
            }
          : entry
      ),
      rfqResponses: current.rfqResponses.map((entry) =>
        entry.rfqId === rfq.id
          ? {
              ...entry,
              status: entry.id === response.id ? "accepted" : "rejected",
              updatedAt: createTimestamp()
            }
          : entry
      )
    }));

    return {
      success: true,
      message: "Supplier response accepted and converted into a purchase order.",
      id: poResult.id
    };
  };

  const reorderFromPurchaseOrder = (orderId: string) => {
    const context = ensureContext();
    if (!context.ok || !canAccess("manage_purchase_orders")) {
      return { success: false, message: "You do not have access to reorder from purchase orders." };
    }

    const order = state.purchaseOrders.find((entry) => entry.id === orderId);
    if (!order || order.buyerBusinessId !== context.businessId) {
      return { success: false, message: "Only your outgoing supplier orders can be repeated." };
    }

    return createPurchaseOrder({
      supplierBusinessId: order.supplierBusinessId,
      issueDate: createTimestamp(),
      expectedDate: order.expectedDate,
      notes: `Reorder based on ${order.reference}.`,
      instructions: order.instructions,
      branchId: order.branchId,
      sourceCatalogId: order.sourceCatalogId,
      lineItems: order.lineItems.map((lineItem) => ({
        ...lineItem,
        id: createId("po-line")
      }))
    });
  };

  const reorderFromPurchaseRecord = (purchaseId: string) => {
    const context = ensureContext();
    if (!context.ok || !canAccess("manage_purchase_orders")) {
      return { success: false, message: "You do not have access to reorder from purchases." };
    }

    const purchase = workspaceData.purchases.find((entry) => entry.id === purchaseId);
    if (!purchase) {
      return { success: false, message: "Purchase record not found." };
    }
    const link = state.supplierLinks.find(
      (entry) => entry.workspaceId === context.workspaceId && entry.supplierId === purchase.supplierId
    );
    if (!link) {
      return { success: false, message: "This supplier is not linked to a network business yet." };
    }

    return createPurchaseOrder({
      supplierBusinessId: link.businessProfileId,
      issueDate: createTimestamp(),
      expectedDate: addDays(
        new Date(),
        workspaceData.settings?.defaultPurchaseDueDays || 14
      ).toISOString(),
      notes: `Reorder based on ${purchase.reference}.`,
      lineItems: purchase.lineItems.map((lineItem) => ({
        id: createId("po-line"),
        name: lineItem.name,
        description: lineItem.description,
        quantity: lineItem.quantity,
        unit: "unit",
        unitPrice: lineItem.unitCost
      }))
    });
  };

  const markNetworkNotificationRead = (notificationId: string) => {
    setState((current) => ({
      ...current,
      networkNotifications: current.networkNotifications.map((notification) =>
        notification.id === notificationId ? { ...notification, isRead: true } : notification
      )
    }));
  };

  const markAllNetworkNotificationsRead = () => {
    if (!currentWorkspace) {
      return;
    }

    setState((current) => ({
      ...current,
      networkNotifications: current.networkNotifications.map((notification) =>
        notification.workspaceId === currentWorkspace.id
          ? { ...notification, isRead: true }
          : notification
      )
    }));
  };

  const resetV4DemoState = () => {
    setState(seedFlowV4State);
    markAllNotificationsRead();
  };

  return (
    <FlowV4Context.Provider
      value={{
        isHydrated,
        currentBusinessId,
        currentBusinessProfile,
        networkPreferences,
        businessProfiles: state.businessProfiles,
        discoverableBusinesses,
        connections: state.connections,
        incomingConnectionRequests,
        outgoingConnectionRequests,
        acceptedConnections,
        bookmarkedBusinessIds,
        visibleCatalogs,
        catalogs: state.catalogs,
        catalogItems: state.catalogItems,
        purchaseOrders: state.purchaseOrders,
        outgoingPurchaseOrders,
        incomingPurchaseOrders,
        rfqs: state.rfqs,
        outgoingRFQs,
        rfqRecipients: state.rfqRecipients,
        incomingRFQRecipients,
        rfqResponses: state.rfqResponses,
        networkSummary,
        networkNotifications,
        unreadNetworkCount,
        networkAuditLogs,
        reorderSuggestions,
        supplierActivitySummary,
        getBusinessProfile,
        getConnectionForBusiness,
        getBusinessCatalogs,
        getCatalogItems,
        getTrustMetrics,
        getRelationshipTimelineForBusiness,
        getSupplierLinkForSupplier,
        toggleBookmark,
        updateBusinessProfile,
        updateNetworkPreferences,
        sendConnectionRequest,
        respondToConnectionRequest,
        disconnectBusiness,
        updateConnectionNotes,
        linkSupplierToBusiness,
        saveCatalog,
        saveCatalogItem,
        archiveCatalog,
        archiveCatalogItem,
        createPurchaseOrder,
        updatePurchaseOrderStatus,
        convertPurchaseOrderToPurchase,
        createRFQ,
        respondToRFQ,
        acceptRFQResponse,
        reorderFromPurchaseOrder,
        reorderFromPurchaseRecord,
        markNetworkNotificationRead,
        markAllNetworkNotificationsRead,
        resetV4DemoState
      }}
    >
      {children}
    </FlowV4Context.Provider>
  );
}

export function useFlowV4() {
  const context = useContext(FlowV4Context);
  if (!context) {
    throw new Error("useFlowV4 must be used within FlowV4Provider.");
  }

  return context;
}
