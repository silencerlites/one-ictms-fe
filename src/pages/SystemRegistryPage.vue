<template>
  <q-page class="registry-page workspace-page">
    <header class="registry-heading">
      <div class="registry-heading__main">
        <div class="registry-heading__icon" aria-hidden="true"><q-icon name="account_tree" size="27px" /></div>
        <div class="registry-heading__copy">
          <div class="section-kicker">DSWD · ONE ICTMS <span class="registry-heading__crumb">/</span> INFORMATION SYSTEM REGISTRY</div>
          <h1>System Registry</h1>
          <p>Register, manage, and monitor information systems within the organization.</p>
        </div>
      </div>
      <div class="registry-heading__right">
        <span class="registry-live-indicator"><span class="registry-live-indicator__dot" /> Registry connected</span>
        <q-btn unelevated no-caps icon="add" label="Register New System" class="registry-add registry-heading__add" @click="openAddSystemChoice" />
      </div>
    </header>

    <section class="registry-stats" aria-label="System status summary">
      <article v-for="stat in statistics" :key="stat.label" class="registry-stat" :class="`registry-stat--${stat.theme}`">
        <div class="registry-stat__top"><span>{{ stat.label }}</span><q-icon :name="stat.icon" size="21px" /></div>
        <div class="registry-stat__body"><div class="registry-stat__icon"><q-icon :name="stat.icon" size="29px" /></div>
          <div><strong>{{ stat.count }}</strong><p>{{ stat.description }}</p></div>
        </div>
      </article>
    </section>

    <section class="registry-panel">
      <div class="registry-panel__heading">
        <div class="registry-panel__title"><span class="registry-panel__eyebrow">SYSTEM DIRECTORY</span><h2>All Systems <span class="registry-panel__count">({{ systems.length }})</span></h2><p>Browse and maintain registered information systems.</p></div>
        <div class="registry-actions">
          <q-input v-model="search" dense outlined clearable placeholder="Search system name, alias, or owner..." class="registry-search" aria-label="Search systems">
            <template #prepend><q-icon name="search" color="indigo-8" /></template>
          </q-input>
          <q-select v-model="statusFilter" dense outlined clearable emit-value map-options :options="statusOptions" label="Registry status" class="registry-status-filter" />
          <q-btn flat round icon="refresh" class="registry-refresh" :loading="loading" aria-label="Reload Registry" @click="void loadRegistries()"><q-tooltip>Refresh systems</q-tooltip></q-btn>

        </div>
      </div>
      <q-banner v-if="loadError" class="bg-red-1 text-negative q-mb-md" rounded>
        {{ loadError }} <q-btn flat label="Retry" color="negative" @click="void loadRegistries()" />
      </q-banner>
      <q-table :rows="filteredSystems" :columns="columns" row-key="id" :loading="loading && systems.length === 0" flat
        :rows-per-page-options="[5, 10, 20, 0]" v-model:pagination="pagination" class="registry-table"
        no-data-label="No registered systems found.">
        <template #body-cell-system_name="props"><q-td :props="props">
          <div class="registry-system-cell"><span class="registry-system-icon" style="background:#4857d3"><q-icon name="dns" size="19px" color="white" /></span>
            <div><strong>{{ props.row.system_name }}</strong><small>{{ props.row.alias || '—' }}</small></div>
          </div>
        </q-td></template>
        <template #body-cell-alias="props"><q-td :props="props">{{ props.row.alias || '—' }}</q-td></template>
        <template #body-cell-business_owner="props"><q-td :props="props">{{ departmentLabel(props.row.business_owner) }}</q-td></template>
        <template #body-cell-status="props"><q-td :props="props">
          <span class="registry-pill registry-pill--status" :class="statusClass(statusLabel(props.row.status))"><span class="registry-pill__dot" />{{ statusLabel(props.row.status) }}</span>
        </q-td></template>
        <template #body-cell-updated_at="props"><q-td :props="props">{{ formatDate(props.row.updated_at) }}</q-td></template>
        <template #body-cell-actions="props"><q-td :props="props">
          <q-btn flat round dense color="indigo-9" icon="more_horiz" aria-label="System actions">
            <q-menu auto-close><q-list dense style="min-width:160px">
              <q-item clickable @click="void openView(props.row.id)"><q-item-section avatar><q-icon name="visibility" /></q-item-section><q-item-section>View</q-item-section></q-item>
              <q-item clickable @click="void openEdit(props.row.id)"><q-item-section avatar><q-icon name="edit" /></q-item-section><q-item-section>Edit</q-item-section></q-item>
              <q-separator />
              <q-item clickable class="text-negative" @click="confirmDelete(props.row)"><q-item-section avatar><q-icon name="delete_outline" /></q-item-section><q-item-section>Delete</q-item-section></q-item>
            </q-list></q-menu>
          </q-btn>
        </q-td></template>
      </q-table>
    </section>

    <!-- Choose whether to register a new IS or work with one already in the Registry. -->
    <q-dialog v-model="addChoiceOpen">
      <q-card class="registry-choice-dialog">
        <q-card-section class="row items-center justify-between">
          <div><div class="text-h6 text-weight-bold">Add System</div><div class="text-caption text-grey-7">Choose how you want to continue.</div></div>
          <q-btn flat round icon="close" aria-label="Close" v-close-popup />
        </q-card-section>
        <q-card-section class="registry-choice-options">
          <button type="button" class="registry-choice-option" @click="chooseNewSystem">
            <q-icon name="add_circle_outline" size="34px" color="indigo-8" />
            <span><strong>New Information System</strong><small>Register a new system using the six-step form.</small></span>
            <q-icon name="chevron_right" size="24px" />
          </button>
          <button type="button" class="registry-choice-option" @click="chooseExistingSystem">
            <q-icon name="manage_search" size="34px" color="indigo-8" />
            <span><strong>Existing Information System</strong><small>Search an already registered IS and update its details.</small></span>
            <q-icon name="chevron_right" size="24px" />
          </button>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="existingSearchOpen">
      <q-card class="registry-existing-dialog">
        <q-card-section class="row items-center justify-between">
          <div><div class="text-h6 text-weight-bold">Find an existing IS</div><div class="text-caption text-grey-7">Select a registered system to open its details for editing.</div></div>
          <q-btn flat round icon="close" aria-label="Close" v-close-popup />
        </q-card-section>
        <q-card-section>
          <q-input v-model="existingQuery" outlined autofocus debounce="200" clearable label="Search IS name, alias or description">
            <template #prepend><q-icon name="search" /></template>
          </q-input>
        </q-card-section>
        <q-card-section class="registry-existing-results">
          <div v-if="loading" class="text-center q-pa-lg"><q-spinner color="indigo-9" size="28px" /> Loading systems...</div>
          <div v-else-if="existingMatches.length === 0" class="text-center text-grey-7 q-pa-xl">No matching registered systems found.</div>
          <q-list v-else separator>
            <q-item v-for="item in existingMatches" :key="item.id" clickable :disable="existingOpening" @click="void selectExistingSystem(item.id)">
              <q-item-section avatar><q-avatar color="indigo-1" text-color="indigo-9" icon="dns" /></q-item-section>
              <q-item-section><q-item-label class="text-weight-medium">{{ item.system_name }}</q-item-label><q-item-label caption>{{ item.alias || 'No alias' }} · {{ departmentLabel(item.business_owner) }}</q-item-label></q-item-section>
              <q-item-section side><q-spinner v-if="existingOpeningId === item.id" size="20px" color="indigo-8" /><q-icon v-else name="chevron_right" /></q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
        <q-card-actions align="right"><q-btn flat no-caps label="Back" @click="existingSearchOpen = false; addChoiceOpen = true" /><q-btn flat no-caps label="Close" v-close-popup /></q-card-actions>
      </q-card>
    </q-dialog>

    <!-- New IS: System Profile is the ONLY modal shown before a record exists. -->
    <q-dialog v-model="profileOpen" persistent transition-show="scale" transition-hide="scale">
      <q-card class="registry-profile-init-dialog">
        <q-card-section class="registry-profile-init-header">
          <div class="registry-profile-init-icon"><q-icon name="dns" size="25px" /></div>
          <div class="registry-profile-init-heading">
            <div class="registry-profile-init-eyebrow">ONE ICTMS / SYSTEM REGISTRY</div>
            <h2>Register an Information System</h2>
            <p>Set up the system profile and choose its development architecture.</p>
          </div>
          <q-btn flat round icon="close" class="registry-profile-init-close" aria-label="Close System Profile" :disable="saving" @click="profileOpen = false" />
        </q-card-section>
        <q-form @submit.prevent="void initiateSystem()">
          <q-card-section class="registry-profile-init-fields">
            <q-banner v-if="library.errors.registryStatuses || library.registryStatuses.length === 0" rounded class="bg-orange-1 text-orange-10">
              Registry Status options are unavailable. <q-btn flat no-caps color="indigo-9" label="Reload Libraries" @click="void loadLibraries()" />
            </q-banner>

            <section class="registry-profile-init-panel" aria-labelledby="registry-profile-info-heading">
              <div class="registry-profile-init-section-heading">
                <div>
                  <h3 id="registry-profile-info-heading">System information</h3>
                  <p>Provide the identifying details of your information system.</p>
                </div>
                <span class="registry-profile-init-required-hint">* Required</span>
              </div>
              <div class="registry-profile-init-inputs">
                <q-input v-model.trim="form.system_name" outlined hide-bottom-space label="System name *" :rules="[requiredText]" class="registry-profile-init-name" />
                <div class="registry-profile-init-grid">
                  <q-input v-model.trim="form.alias" outlined label="Alias" />
                  <q-select v-model="form.status" outlined hide-bottom-space label="Registry status *" :options="library.registryStatuses" option-label="name" option-value="id" emit-value map-options :rules="[requiredId]" :display-value="selectedStatusName" :disable="library.registryStatuses.length === 0" />
                </div>
                <q-input v-model.trim="form.description" type="textarea" autogrow outlined label="Description" class="registry-profile-init-description" />
                <q-select v-model="form.business_owner" outlined clearable label="Business owner (Department)" :options="departmentOptions" option-label="name" option-value="id" emit-value map-options />
              </div>
            </section>

            <section class="registry-profile-init-panel registry-profile-init-panel--architecture" aria-labelledby="registry-profile-type-heading">
              <div class="registry-profile-init-section-heading">
                <div>
                  <h3 id="registry-profile-type-heading">Development Solution Type</h3>
                  <p>Choose how this system is developed and deployed.</p>
                </div>
              </div>
              <div class="registry-profile-init-solution-grid" role="group" aria-label="Development Solution Type">
                <button v-for="option in library.developmentSolutionTypes" :key="option.id" type="button"
                  class="registry-profile-init-solution" :class="{ 'is-selected': Number(form.repo.development_solution_type) === Number(option.id) }"
                  :aria-pressed="Number(form.repo.development_solution_type) === Number(option.id)"
                  @click="selectDevelopmentSolution(Number(option.id))">
                  <span class="registry-profile-init-solution-icon"><q-icon :name="solutionTypeIcon(option.name)" size="23px" /></span>
                  <span class="registry-profile-init-solution-name">{{ option.name }}</span>
                </button>
              </div>
              <div v-if="!library.developmentSolutionTypes.length" class="text-caption text-grey-7">Development Solution Type options are not available. Check the Library API.</div>
            </section>
          </q-card-section>
          <q-separator />
          <q-card-actions class="registry-profile-init-footer">
            <div class="registry-profile-init-footer-note"><q-icon name="info_outline" size="17px" /> You can complete the remaining details after initiation.</div>
            <div class="registry-profile-init-footer-actions">
              <q-btn flat no-caps label="Cancel" :disable="saving" @click="profileOpen = false" />
              <q-btn type="submit" unelevated no-caps color="primary" icon-right="arrow_forward" label="Initiate System" :loading="saving" class="registry-profile-init-submit" />
            </div>
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <q-dialog v-model="formOpen" persistent transition-show="scale" transition-hide="scale">
      <q-card class="registry-dialog registry-dialog--wide registry-dialog--editor">
        <q-card-section class="registry-wizard-header">
          <div class="registry-wizard-header__icon"><q-icon name="app_registration" size="26px" /></div>
          <div class="registry-wizard-header__copy">
            <div class="registry-wizard-header__eyebrow">DSWD · ONE ICTMS / INFORMATION SYSTEM REGISTRY</div>
            <div class="text-h6 text-weight-bold" aria-live="polite">{{ wizardStepLabels[formStep - 1] }}</div>
            <p class="registry-wizard-header__subtitle">{{ formStep === 1 ? 'A complete, read-only overview of the registered system.' : 'Review and maintain this section of your information system.' }}</p>
          </div>
          <div class="registry-wizard-header__art" aria-hidden="true">
            <span class="registry-wizard-header__art-screen"><q-icon name="terminal" size="37px" /></span>
            <span class="registry-wizard-header__art-gear"><q-icon name="settings" size="24px" /></span>
          </div>
          <div class="registry-wizard-header__aside">
            <q-btn flat round icon="close" aria-label="Close registration" :disable="saving" @click="formOpen = false" />
          </div>
        </q-card-section>
        <div class="registry-wizard-progress" role="progressbar" :aria-valuenow="formStep" aria-valuemin="1" :aria-valuemax="stepLabels.length" aria-label="Registration section progress">
          <div class="registry-wizard-progress__fill" :style="{ width: `${(formStep / stepLabels.length) * 100}%` }"></div>
        </div>
        <q-form class="registry-wizard-form" @submit.prevent="void saveSystem()">
          <div class="registry-wizard-layout">
            <aside class="registry-wizard-sidebar" aria-label="Registration sections">
              <div class="registry-wizard-steps" aria-label="Registration progress">
              <button v-for="(label, index) in wizardStepLabels" :key="label" type="button" class="registry-wizard-step"
                :class="{ 'is-current': formStep === index + 1, 'is-complete': formStep > index + 1 }"
                :aria-current="formStep === index + 1 ? 'step' : undefined"
                :disabled="saving" @click="goToStep(index + 1)">
                
                <q-icon :name="wizardStepIcons[index]" size="20px" class="registry-wizard-step__icon" aria-hidden="true" />
                <span class="registry-wizard-step__label">{{ label }}</span>
                <q-icon v-if="formStep === index + 1" name="chevron_right" size="19px" class="registry-wizard-step__arrow" />
              </button>
              </div>
              <div class="registry-sidebar-hint"><q-icon name="info_outline" size="19px" /><span>Your updates are saved when you select Save Changes.</span></div>
            </aside>
            <q-card-section class="registry-form registry-form--scroll registry-wizard-main">
            <q-banner v-if="library.errors.registryStatuses || library.registryStatuses.length === 0" rounded class="bg-orange-1 text-orange-10 q-mb-md">
              Registry Status options are not available. Check the Registry Status Library API and make sure active statuses have been seeded.
              <q-btn flat no-caps color="indigo-9" label="Reload Libraries" @click="void loadLibraries()" />
            </q-banner>
            <div v-show="formStep === 1" class="registry-wizard-content registry-details-view">
              <section class="registry-details-section registry-details-section--unboxed" aria-label="Registry details">

                <div v-for="(section, sectionIndex) in registryOverviewSections" :key="section.title" class="registry-overview-block" :class="{ 'registry-overview-block--profile': sectionIndex === 0 }">
                  <template v-if="sectionIndex === 0">
                    <div class="registry-profile-summary">
                      <span class="registry-profile-summary__icon"><q-icon name="layers" size="26px" /></span>
                      <div class="registry-profile-summary__copy">
                        <span class="registry-profile-summary__kicker">SYSTEM PROFILE</span>
                        <h3>{{ section.fields[0]?.value || '—' }}</h3>
                      </div>
                      <span class="registry-profile-summary__status" :class="statusClass(section.fields[1]?.value || '')">
                        <span class="registry-profile-summary__dot" />{{ section.fields[1]?.value || '—' }}
                      </span>
                    </div>
                    <dl class="registry-profile-summary__details">
                      <div class="registry-profile-summary__detail">
                        <span class="registry-profile-summary__detail-icon"><q-icon name="description" size="20px" /></span>
                        <div><dt>Description</dt><dd>{{ section.fields[3]?.value || 'No description provided.' }}</dd></div>
                      </div>
                      <div class="registry-profile-summary__detail">
                        <span class="registry-profile-summary__detail-icon"><q-icon name="groups" size="20px" /></span>
                        <div><dt>Business Owner</dt><dd>{{ section.fields[2]?.value || '—' }}</dd></div>
                      </div>
                    </dl>
                  </template>
                  <template v-else>
                    <div class="registry-overview-block__heading">
                      <span class="registry-overview-heading-icon"><q-icon :name="section.icon" size="20px" /></span>
                      <h5>{{ section.title }}</h5>
                    </div>
                    <dl class="registry-details-section__fields registry-details-readonly">
                      <div v-for="field in section.fields" :key="field.label" class="registry-details-readonly__item" :class="{ 'registry-details-readonly__item--wide': field.wide, 'registry-details-readonly__item--prominent': field.prominent }">
                        <dt>{{ field.label }}</dt>
                        <dd v-if="field.status"><span class="registry-details-readonly__status" :class="statusClass(field.value)">{{ field.value }}</span></dd>
                        <dd v-else :class="{ 'registry-details-readonly__description-value': field.label === 'Description' }">{{ field.value }}</dd>
                      </div>
                    </dl>
                  </template>
                </div>

                <div class="registry-overview-block">
                  <div class="registry-overview-block__heading"><span class="registry-overview-heading-icon"><q-icon name="groups" size="19px" /></span><h5>Stakeholders</h5></div>
                  <div v-if="detailStakeholders.length" class="registry-overview-list">
                    <div v-for="(person, index) in detailStakeholders" :key="`${person.user_id}-${index}`" class="registry-overview-list__row">
                      <div class="registry-overview-list__main"><strong>{{ person.stakeholder_type_name || library.labelFor('stakeholderTypes', person.stakeholder_type) || 'Unknown role' }}</strong><span>{{ detailUserName(person.user_id) }}</span></div>
                    </div>
                  </div>
                  <div v-else class="registry-overview-empty">No stakeholders assigned.</div>
                </div>

                <div class="registry-overview-block">
                  <div class="registry-overview-block__heading"><span class="registry-overview-heading-icon"><q-icon name="description" size="19px" /></span><h5>Documents</h5></div>
                  <div v-if="detailDocuments.length" class="registry-overview-list">
                    <div v-for="(doc, index) in detailDocuments" :key="`${doc.docs_type}-${index}`" class="registry-overview-list__row">
                      <div class="registry-overview-list__main"><strong>{{ doc.docs_type_name || library.labelFor('documentTypes', doc.docs_type) || `Document type #${doc.docs_type}` }}</strong><span>{{ documentPathSummary(doc.file_path) }}</span></div>
                    </div>
                  </div>
                  <div v-else class="registry-overview-empty">No document records.</div>
                </div>
              </section>
            </div>
            <div v-show="formStep === 2" class="registry-wizard-content registry-management">
              <section class="registry-management__card" aria-labelledby="registry-management-heading">
                <div class="registry-management__heading">
                  <span class="registry-management__icon"><q-icon name="corporate_fare" size="25px" /></span>
                  <div>
                    <h3 id="registry-management-heading">Management arrangement</h3>
                    <p>Choose who manages the system. Related fields appear automatically.</p>
                  </div>
                </div>
                <div class="registry-management__body">
                  <q-select
                    v-model="form.desc.managing_type"
                    outlined clearable emit-value map-options
                    label="Managing Type"
                    :options="library.managingTypes"
                    option-label="name" option-value="id"
                    class="registry-management__type"
                    @update:model-value="onManagingTypeChanged"
                  >
                  </q-select>

                  <div
                    v-if="showManagingOffice || showThirdPartyCompany"
                    class="registry-management__conditional"
                    :class="{ 'registry-management__conditional--both': showManagingOffice && showThirdPartyCompany }"
                  >
                    <q-select
                      v-if="showManagingOffice"
                      v-model="form.desc.managing_office"
                      outlined clearable emit-value map-options
                      label="Managing Office (Department)"
                      :options="departmentOptions"
                      option-label="name"
                      option-value="id"
                    />
                    <q-input
                      v-if="showThirdPartyCompany"
                      v-model.trim="form.desc.third_party_company"
                      outlined
                      label="Third-Party Company"
                    />
                  </div>
                </div>
              </section>

              <section class="registry-management__card" aria-labelledby="registry-management-schedule">
                <div class="registry-management__heading">
                  <span class="registry-management__icon"><q-icon name="event_note" size="25px" /></span>
                  <div>
                    <h3 id="registry-management-schedule">Project timeline</h3>
                    <p>Track planned delivery dates and project duration.</p>
                  </div>
                </div>
                <div class="registry-management__body registry-management__timeline">
                  <q-input v-model="form.desc.project_roll_on" outlined type="date" label="Project Roll-On" stack-label />
                  <q-input v-model="form.desc.project_sign_off" outlined type="date" label="Project Sign-Off" stack-label />
                  <q-input v-model.number="form.desc.estimation_project_duration" outlined type="number" min="0" label="Estimated Development Duration (days)" class="registry-management__duration" />
                </div>
              </section>
            </div>
            <div v-show="formStep === 3" class="registry-wizard-content registry-documents">
              <p class="text-caption text-grey-7 q-ma-none">{{ managementMode === 'unselected' ? 'Select a Managing Type in the Management tab to enable document actions.' : managementMode === 'third-party' ? 'Upload the document provided by the external company.' : managementMode === 'joint' ? 'Assign a responsible user, upload a document, or prepare a draft.' : 'Assign a responsible user before uploading or preparing a document draft.' }}</p>
              <RegistryDocumentRow
                v-for="(doc, index) in form.docs.slice(0, 4)"
                :key="doc.docs_type"
                :doc="doc"
                :index="index"
                :management-mode="managementMode"
                :document-name="library.labelFor('documentTypes', Number(doc.docs_type))"
                :selected-file-name="documentFiles[String(index)] ?? ''"
                :draft-name="documentDraftNames[String(index)] ?? ''"
                :assignee-name="documentAssignees[String(index)] ? documentAssigneeName(documentAssignees[String(index)]) : ''"
                @upload="triggerDocumentFile"
                @draft="createDocumentDraftName"
                @assign="openDocumentAssignee"
                @remove-assignee="removeDocumentAssignee"
                @view="viewDocumentFile"
                @edit="editDocumentFile"
                @file-selected="onDocumentFileSelected"
              />
            </div>
            <q-dialog v-model="documentDraftDialog">
              <q-card class="registry-document-assign-dialog">
                <q-card-section class="row items-center justify-between">
                  <div>
                    <div class="text-h6">{{ editingDraftName }}</div>
                    <div class="text-caption text-grey-7">Local working draft — not AI-generated or saved to the server.</div>
                  </div>
                  <q-btn flat round icon="close" v-close-popup />
                </q-card-section>
                <q-card-section>
                  <q-input v-model="editingDraftContent" outlined type="textarea" autogrow
                    :readonly="!editingDraftEnabled" label="Draft content" />
                </q-card-section>
                <q-card-actions align="right">
                  <q-btn flat no-caps label="Close" v-close-popup />
                  <q-btn v-if="editingDraftEnabled" unelevated no-caps color="indigo-8"
                    label="Save local draft" @click="saveDocumentDraft" />
                </q-card-actions>
              </q-card>
            </q-dialog>
            <q-dialog v-model="documentPathDialog">
              <q-card class="registry-document-assign-dialog">
                <q-card-section class="row items-center justify-between">
                  <div class="text-h6">Edit document file path</div>
                  <q-btn flat round icon="close" v-close-popup />
                </q-card-section>
                <q-card-section>
                  <q-input v-model.trim="editingDocumentPath" outlined autofocus label="Stored file path or URL" />
                  <div class="text-caption text-grey-7 q-mt-sm">This updates the document path in the Registry form; it does not modify the actual file.</div>
                </q-card-section>
                <q-card-actions align="right">
                  <q-btn flat no-caps label="Cancel" v-close-popup />
                  <q-btn unelevated no-caps color="indigo-8" label="Save path" @click="saveDocumentPath" />
                </q-card-actions>
              </q-card>
            </q-dialog>
            <q-dialog v-model="documentAssigneeDialog">
              <q-card class="registry-document-assign-dialog">
                <q-card-section class="row items-center justify-between">
                  <div><div class="text-h6">Assign document task</div><div class="text-caption text-grey-7">Select a user assigned to the Managing Office.</div></div>
                  <q-btn flat round icon="close" v-close-popup />
                </q-card-section>
                <q-card-section>
                  <q-select v-model="selectedDocumentAssignee" outlined emit-value map-options use-input fill-input hide-selected input-debounce="0" :options="filteredDocumentAssigneeOptions" @filter="filterDocumentAssignees" label="Assigned user" clearable />
                  <div v-if="!documentAssigneeOptions.length" class="text-caption text-negative q-mt-sm">No Managing Office users available. Select an internally managed Managing Type and Managing Office, and confirm that the department has assigned users.</div>
                  <div class="text-caption text-grey-7 q-mt-md">Task assignments are kept locally; the current Registry API does not save document assignees.</div>
                </q-card-section>
                <q-card-actions align="right">
                  <q-btn flat no-caps label="Cancel" v-close-popup />
                  <q-btn unelevated no-caps color="indigo-8" label="Assign task" :disable="selectedDocumentAssignee == null || !documentAssigneeOptions.some(option => option.value === selectedDocumentAssignee)" @click="assignDocumentTask" />
                </q-card-actions>
              </q-card>
            </q-dialog>
            <div v-show="formStep === 4" class="registry-wizard-content registry-stakeholders-layout">
              <section class="registry-stakeholder-workflow" aria-labelledby="registry-assign-stakeholder-title">
                <div class="registry-stakeholders-column__heading">
                  <span class="registry-stakeholders-column__icon"><q-icon name="group_add" size="21px" /></span>
                  <div><h3 id="registry-assign-stakeholder-title">Assign Stakeholders</h3><p>Select users from each available department and assign their roles.</p></div>
                </div>
                <div class="registry-stakeholders-grid">
                    <section v-for="group in stakeholderSections" :key="group.key" class="registry-stakeholder-section">
                      <div class="registry-stakeholder-section__title">
                        <div>
                          <strong>{{ group.title }}</strong>
                          <div class="text-caption text-grey-7">{{ group.departmentId != null ? departmentLabel(group.departmentId) : 'No department selected' }}</div>
                        </div>
                        <q-chip dense color="indigo-1" text-color="indigo-9">{{ group.users.length }} users</q-chip>
                      </div>
                      <div v-if="group.departmentId == null" class="registry-stakeholder-empty">
                        {{ group.key === 'owner' ? 'Select a Business Owner in the System Profile to assign department users.' : 'Select a Managing Office in the Management tab to assign department users.' }}
                      </div>
                      <div v-else-if="departmentUsersLoading && !departmentLoadedIds.includes(group.departmentId)" class="registry-stakeholder-empty row items-center justify-center q-gutter-sm">
                        <q-spinner color="indigo-9" size="20px" /> Loading {{ group.title }} users...
                      </div>
                      <div v-else-if="departmentErrors[group.departmentId]" class="registry-stakeholder-empty">
                        <div class="text-negative q-mb-sm">{{ departmentErrors[group.departmentId] }}</div>
                        <q-btn outline no-caps color="indigo-9" label="Retry loading users" @click="reloadDepartmentUsers" />
                      </div>
                      <div v-else-if="group.users.length === 0" class="registry-stakeholder-empty">
                        No users are available in this {{ group.title }} department.
                        <div class="q-mt-sm"><q-btn flat no-caps color="indigo-9" icon="refresh" label="Reload users" @click="reloadDepartmentUsers" /></div>
                      </div>
                      <div v-else class="registry-assign-panel">
                        <div class="registry-assign-controls">
                          <q-select v-model="sectionRoles[group.key]" outlined dense clearable emit-value map-options
                            label="Stakeholder type *" :options="library.stakeholderTypes"
                            option-label="name" option-value="id" class="registry-assign-type" />
                          <q-btn unelevated no-caps color="indigo-9" icon="group_add"
                            :disable="sectionSelections[group.key].length === 0 || sectionRoles[group.key] == null || saving"
                            :label="`Assign ${sectionSelections[group.key].length}`"
                            @click="assignSectionStakeholders(group.key)" />
                        </div>
                        <div class="registry-department-group__header">
                          <span>{{ group.users.length }} available users</span>
                          <q-checkbox :model-value="allSectionUsersSelected(group.key, group.users)"
                            color="indigo-9" label="Select all" @update:model-value="checked => selectSectionUsers(group.key, group.users, checked)" />
                        </div>
                        <div class="registry-stakeholder-list">
                          <div v-for="user in group.users" :key="user.id" class="registry-stakeholder-item">
                            <q-checkbox :model-value="sectionSelections[group.key].includes(user.id)" color="indigo-9"
                              @update:model-value="checked => selectSectionUser(group.key, user.id, checked)" />
                            <q-avatar color="indigo-1" text-color="indigo-9" size="35px">{{ userInitials(user.name) }}</q-avatar>
                            <div class="registry-stakeholder-person"><strong>{{ user.name }}</strong><span>{{ user.email || 'No email provided' }}</span></div>
                            <q-chip v-if="isStakeholderSelected(user.id)" dense outline color="indigo-8" icon="check_circle">
                              {{ library.labelFor('stakeholderTypes', stakeholderTypeFor(user.id)) }}
                            </q-chip>
                          </div>
                        </div>
                      </div>
                    </section>


                </div>
              </section>
              <section class="registry-stakeholder-workflow" aria-labelledby="registry-assigned-stakeholder-title">
                <div class="registry-stakeholders-column__heading">
                  <span class="registry-stakeholders-column__icon"><q-icon name="groups" size="21px" /></span>
                  <div><h3 id="registry-assigned-stakeholder-title">Assigned Groups</h3><p>Stakeholders grouped by department and role.</p></div>
                </div>
                <div class="registry-stakeholders-grid">
                  <section v-for="section in assignedStakeholderSections" :key="section.key" class="registry-assigned-department">
                    <div class="registry-stakeholder-section__title">
                      <div>
                        <strong>{{ section.title }}</strong>
                        <div class="text-caption text-grey-7">{{ section.departmentId != null ? departmentLabel(section.departmentId) : 'No department selected' }}</div>
                      </div>
                      <q-chip dense color="indigo-1" text-color="indigo-9">{{ section.users.length }} assigned</q-chip>
                    </div>
                    <div v-if="section.groups.length" class="registry-assigned-groups">
                      <section v-for="group in section.groups" :key="group.id" class="registry-assigned-group">
                        <div class="registry-assigned-group__header"><strong>{{ group.name }}</strong><q-chip dense color="indigo-1" text-color="indigo-9">{{ group.users.length }} user(s)</q-chip></div>
                        <div v-for="user in group.users" :key="user.user_id" class="registry-assigned-user">
                          <q-icon name="person" color="indigo-8" size="19px" />
                          <span>{{ userDisplayName(user.user_id) }}</span>
                          <q-btn round dense flat icon="close" color="negative" aria-label="Remove assignment" @click="removeStakeholder(user.user_id)" />
                        </div>
                      </section>
                    </div>
                    <div v-else class="registry-stakeholder-empty">No stakeholders assigned to this department.</div>
                  </section>
                </div>
                <section v-if="unclassifiedStakeholderGroups.length" class="registry-assigned-unclassified">
                  <div class="registry-stakeholder-section__title"><div><strong>Other Assigned Users</strong><div class="text-caption text-grey-7">Department membership could not be verified from the loaded directory.</div></div></div>
                  <div class="registry-assigned-groups">
                    <section v-for="group in unclassifiedStakeholderGroups" :key="group.id" class="registry-assigned-group">
                      <div class="registry-assigned-group__header"><strong>{{ group.name }}</strong></div>
                      <div v-for="user in group.users" :key="user.user_id" class="registry-assigned-user">
                        <q-icon name="person" color="indigo-8" size="19px" />
                        <span>{{ userDisplayName(user.user_id) }}</span>
                        <q-btn round dense flat icon="close" color="negative" aria-label="Remove assignment" @click="removeStakeholder(user.user_id)" />
                      </div>
                    </section>
                  </div>
                </section>
              </section>
              <div v-if="library.stakeholderTypes.length === 0" class="text-caption text-orange-9">Stakeholder types are unavailable. Reload the Stakeholder Type Library.</div>
            </div>
            <div v-show="formStep === 5" class="registry-wizard-content registry-technology">
              <div class="registry-technology__intro">
                <span class="registry-technology__intro-icon"><q-icon name="developer_board" size="24px" /></span>
                <div>
                  <h3>Technology Configuration</h3>
                  <p>Define the technologies and infrastructure used to build and run this information system.</p>
                </div>
              </div>

              <div class="registry-technology__stack-grid">
                <section class="registry-technology__card" aria-labelledby="registry-technology-frontend-title">
                  <div class="registry-technology__card-header">
                    <span class="registry-technology__card-icon registry-technology__card-icon--frontend"><q-icon name="desktop_windows" size="22px" /></span>
                    <div>
                      <h4 id="registry-technology-frontend-title">Frontend Stack</h4>
                      <p>Client-side frameworks and UI technologies</p>
                    </div>
                  </div>
                  <q-select
                    v-model="form.tech_stack.frontend_stack"
                    multiple use-chips outlined clearable
                    label="Frontend technologies"
                    :options="library.techStacks"
                    :option-label="techLabel"
                    option-value="id" emit-value map-options
                    dropdown-icon="expand_more"
                    class="registry-technology__field"
                  />
                  <div class="registry-technology__helper"><q-icon name="info_outline" size="15px" /> Select one or more technologies</div>
                </section>

                <section class="registry-technology__card" aria-labelledby="registry-technology-backend-title">
                  <div class="registry-technology__card-header">
                    <span class="registry-technology__card-icon registry-technology__card-icon--backend"><q-icon name="dns" size="22px" /></span>
                    <div>
                      <h4 id="registry-technology-backend-title">Backend Stack</h4>
                      <p>Server-side languages, frameworks and APIs</p>
                    </div>
                  </div>
                  <q-select
                    v-model="form.tech_stack.backend_stack"
                    multiple use-chips outlined clearable
                    label="Backend technologies"
                    :options="library.techStacks"
                    :option-label="techLabel"
                    option-value="id" emit-value map-options
                    dropdown-icon="expand_more"
                    class="registry-technology__field"
                  />
                  <div class="registry-technology__helper"><q-icon name="info_outline" size="15px" /> Select one or more technologies</div>
                </section>
              </div>

              <section class="registry-technology__card registry-technology__infrastructure" aria-labelledby="registry-technology-infra-title">
                <div class="registry-technology__card-header">
                  <span class="registry-technology__card-icon registry-technology__card-icon--infra"><q-icon name="storage" size="22px" /></span>
                  <div>
                    <h4 id="registry-technology-infra-title">Database &amp; Infrastructure</h4>
                    <p>Configure where your system data and services are hosted.</p>
                  </div>
                </div>
                <div class="registry-technology__infra-grid">
                  <q-input v-model.trim="form.tech_stack.database" outlined label="Database" placeholder="e.g. MySQL, PostgreSQL" class="registry-technology__field">
                    <template #prepend><q-icon name="database" size="19px" /></template>
                  </q-input>
                  <q-input v-model.trim="form.tech_stack.server_type" outlined label="Server type" placeholder="e.g. Cloud, On-premises" class="registry-technology__field">
                    <template #prepend><q-icon name="cloud_queue" size="19px" /></template>
                  </q-input>
                  <q-input v-model.trim="form.tech_stack.server_name" outlined label="Server name" placeholder="e.g. Application Server 01" class="registry-technology__field registry-technology__server-name">
                    <template #prepend><q-icon name="computer" size="19px" /></template>
                  </q-input>
                </div>
              </section>
            </div>
            <div v-show="formStep === 6" class="registry-wizard-content">

            <div v-if="isFullstackSolution" class="registry-repository-pair">
              <section v-for="scope in repositoryScopes" :key="scope" class="registry-repository-section registry-repository-card">
                <div class="registry-repository-section__header">
                  <q-icon :name="scope === 'frontend' ? 'desktop_windows' : 'dns'" size="23px" />
                  <div><h3>{{ scope === 'frontend' ? 'Frontend Repository' : 'Backend Repository' }}</h3><p>Git source and environment URLs</p></div>
                </div>
                <div class="registry-repository-fields">
                  <q-input v-model.trim="form.repo[`${scope}_repo_git`]" outlined label="Git Repository URL" type="url" />
                  <q-input v-model.trim="form.repo[`${scope}_staging_url`]" outlined label="Staging URL" type="url" />
                  <q-input v-model.trim="form.repo[`${scope}_production_url`]" outlined label="Production URL" type="url" />
                </div>
              </section>
            </div>
            <section v-else class="registry-repository-section registry-repository-card">
              <div class="registry-repository-section__header"><q-icon name="source" size="23px" /><div><h3>Repository and Deployment URLs</h3><p>One repository for this development solution.</p></div></div>
              <div class="registry-repository-fields">
                <q-input v-model.trim="form.repo.repo_git" outlined label="Git Repository URL" type="url" />
                <q-input v-model.trim="form.repo.staging_url" outlined label="Staging URL" type="url" />
                <q-input v-model.trim="form.repo.production_url" outlined label="Production URL" type="url" />
              </div>
            </section>

            </div>
            </q-card-section>
          </div>
          <q-separator />
          <q-card-actions align="right" class="registry-wizard-footer q-pa-md">
            <q-btn flat no-caps label="Cancel" :disable="saving" @click="formOpen = false" />
            <div class="q-mr-auto"></div>
            <q-btn v-if="formStep > 1" flat no-caps icon="arrow_back" label="Back" :disable="saving" @click="formStep--" />
            <q-btn v-if="formStep < stepLabels.length" unelevated no-caps color="indigo-9" icon-right="arrow_forward" label="Next" :disable="saving" @click="nextStep" />
            <q-btn unelevated no-caps type="submit" color="primary" icon="save" label="Save Changes" :loading="saving" :disable="saving" aria-label="Save registry changes and close modal" />
            <q-btn v-if="formStep === stepLabels.length" unelevated no-caps type="button" color="indigo-9" icon-right="play_arrow" label="Execute" :disable="saving" aria-label="Review task generation acknowledgement" @click="requestScrumExecution" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- Confirm the implications of Execute before opening the frontend-only planning preview. -->
    <q-dialog v-model="scrumAcknowledgementOpen" persistent transition-show="scale" transition-hide="scale">
      <q-card class="registry-execution-confirm">
        <header class="registry-execution-confirm__header">
          <div class="registry-execution-confirm__icon"><q-icon name="auto_awesome" size="28px" /></div>
          <div class="registry-execution-confirm__heading">
            <span class="registry-execution-confirm__eyebrow">ONE ICTMS · PROJECT EXECUTION</span>
            <h2>Confirm AI Task Generation</h2>
            <p>Review and acknowledge the next step before checking generated tasks.</p>
          </div>
          <q-btn flat round dense icon="close" color="white" aria-label="Cancel execution" @click="cancelScrumExecution" />
        </header>
        <q-card-section class="registry-execution-confirm__body">
          <div class="registry-execution-confirm__intro">
            <q-icon name="info_outline" size="21px" />
            <p>By proceeding, you acknowledge that the execution workflow is intended to generate suggested development tasks based on the following project documents. The Project Manager or Scrum Master must evaluate the tasks before scheduling them into sprints.</p>
          </div>
          <div class="registry-execution-confirm__section-title">Source documents for task generation</div>
          <div class="registry-execution-confirm__docs">
            <div v-for="doc in scrumAcknowledgementDocuments" :key="doc.code" class="registry-execution-confirm__doc">
              <div class="registry-execution-confirm__doc-icon"><q-icon :name="doc.icon" size="21px" /></div>
              <div><strong>{{ doc.name }}</strong><span>{{ doc.code }}</span></div>
              <q-icon name="description" class="registry-execution-confirm__doc-mark" size="19px" />
            </div>
          </div>
          <div class="registry-execution-confirm__preview-note">
            <q-icon name="science" size="19px" />
            <span><strong>Frontend preview:</strong> The next screen lets you review and edit sample tasks before Scrum Planning. No AI request is sent, and no tasks or sprint plans are saved.</span>
          </div>
          <q-checkbox v-model="scrumExecutionAcknowledged" color="indigo-9" class="registry-execution-confirm__checkbox"
            label="I understand that suggested tasks require Project Manager or Scrum Master review before sprint planning." />
        </q-card-section>
        <q-separator />
        <q-card-actions align="right" class="registry-execution-confirm__footer">
          <q-btn flat no-caps color="grey-8" label="Cancel" @click="cancelScrumExecution" />
          <q-btn unelevated no-caps color="indigo-9" icon-right="arrow_forward" label="Acknowledge & Continue"
            :disable="!scrumExecutionAcknowledged" @click="confirmScrumExecution" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Task quality gate: PM/Scrum Master checks and edits suggested tasks before sprint planning. -->
    <q-dialog v-model="scrumTaskReviewOpen" persistent maximized transition-show="slide-up" transition-hide="slide-down">
      <q-card class="scrum-review-page">
        <header class="scrum-review-page__header">
          <div>
            <h2>Review & Edit Tasks</h2>
            <p>Verify requirements, correct suggested work, and approve each task before Scrum Planning.</p>
          </div>
          <q-btn flat round icon="close" color="white" aria-label="Close task review" @click="scrumTaskReviewOpen = false" />
        </header>
        <div class="scrum-review-page__summary">
          <span><q-icon name="assignment" size="18px" /><b>{{ scrumTasks.length }}</b> total tasks</span>
          <span><q-icon name="task_alt" size="18px" color="positive" /><b>{{ approvedScrumTasks }}</b> approved</span>
          <span><q-icon name="pending_actions" size="18px" /><b>{{ pendingScrumTasks }}</b> awaiting review</span>
          <span><q-icon name="rate_review" size="18px" /><b>{{ revisionScrumTasks }}</b> needs revision</span>
          <div class="scrum-review-page__progress" aria-label="Task approval progress">
            <div class="scrum-review-page__progress-caption"><strong>Review progress</strong><span>{{ scrumTasks.length ? Math.round((approvedScrumTasks / scrumTasks.length) * 100) : 0 }}% approved</span></div>
            <q-linear-progress rounded size="7px" color="positive" track-color="grey-3" :value="scrumTasks.length ? approvedScrumTasks / scrumTasks.length : 0" />
          </div>
        </div>
        <div class="scrum-review-page__toolbar">
          <q-input v-model="scrumReviewSearch" dense outlined clearable debounce="150" placeholder="Find task code, title, module or story" class="scrum-review-page__search">
            <template #prepend><q-icon name="search" /></template>
          </q-input>
          <q-select v-if="scrumReviewTab === 'stories'" v-model="scrumReviewCategoryFilter" dense outlined emit-value map-options :options="scrumCategoryFilters.map(item => ({ label: item, value: item }))" label="Category" style="min-width:170px" />
          <q-select v-model="scrumReviewStatusFilter" dense outlined emit-value map-options :options="scrumReviewStatusOptions" label="Review status" class="scrum-review-page__status-select" />
          <q-btn v-if="scrumReviewSearch || scrumReviewStatusFilter !== 'All Statuses' || scrumReviewCategoryFilter !== 'All Categories'"
            flat dense no-caps icon="filter_alt_off" label="Clear filters" color="indigo-9"
            @click="clearScrumReviewFilters" />
        </div>
        <q-tabs v-model="scrumReviewTab" dense align="left" active-color="indigo-9" indicator-color="indigo-9" class="scrum-review-page__main-tabs text-grey-8" no-caps>
          <q-tab name="stories" icon="menu_book" label="User Stories / Acceptance Criteria" />
          <q-tab name="modules" icon="layers" label="Modules / Generated Tasks" />
        </q-tabs>
        <q-separator />
        <div class="scrum-review-page__creation-toolbar row items-center justify-between q-px-md q-py-sm">
          <span class="text-caption text-grey-7">{{ scrumReviewTab === 'stories' ? 'User Stories → Acceptance Criteria' : 'Modules → Generated Tasks' }}</span>
          <q-btn v-if="scrumReviewTab === 'stories'" color="indigo-9" no-caps unelevated icon="add" label="Add User Story" @click="openScrumStoryCreator" />
          <q-btn v-else color="indigo-9" no-caps unelevated icon="add" label="Add Module" @click="openScrumModuleCreator" />
        </div>
        <div class="scrum-review-page__body">
          <template v-if="scrumReviewTab === 'stories'">
            <q-expansion-item v-for="story in scrumReviewStories" :key="story" group="review-stories"
              class="scrum-review-page__story q-mb-md" header-class="text-weight-bold" expand-separator>
              <template #header>
                <q-item-section avatar><q-icon name="menu_book" color="indigo-8" /></q-item-section>
                <q-item-section>{{ story }}</q-item-section>
                <q-item-section side><q-btn flat dense round icon="edit" color="indigo-9" aria-label="Edit user story" @click.stop="openScrumRequirementEditor('story', story)"><q-tooltip>Edit User Story</q-tooltip></q-btn></q-item-section>
              </template>
              <q-card-section class="q-pt-sm">
                <div v-if="scrumReviewCriteria(story).length === 0" class="text-caption text-grey-7 q-mb-sm">No acceptance criteria available.</div>
                <div class="text-caption text-grey-7 q-mb-md">Acceptance criteria for this user story. Editing a requirement resets its linked tasks to Pending Review.</div>
                <div v-for="criterion in scrumReviewCriteria(story)" :key="criterion" class="scrum-review-page__criterion q-mb-sm">
                  <div class="row items-center no-wrap q-gutter-sm">
                    <q-icon name="fact_check" color="indigo-8" size="20px" />
                    <span class="col">{{ criterion }}</span>
                    <q-badge color="grey-2" text-color="grey-9">{{ scrumReviewTasksFor(story, criterion).length }} tasks</q-badge>
                    <q-btn flat dense round icon="visibility" color="indigo-9" aria-label="View acceptance criterion" @click="viewScrumCriterion(story, criterion)"><q-tooltip>View Criterion</q-tooltip></q-btn>
                    <q-btn flat dense round icon="edit" color="indigo-9" aria-label="Edit acceptance criterion" @click="openScrumRequirementEditor('criterion', criterion, story)"><q-tooltip>Edit Criterion</q-tooltip></q-btn>
                    <q-btn flat dense round icon="delete_outline" color="negative" aria-label="Remove acceptance criterion" @click="confirmRemoveScrumCriterion(story, criterion)"><q-tooltip>Remove Criterion</q-tooltip></q-btn>
                    <q-btn flat dense round :icon="scrumCriterionTasksHidden(story, criterion) ? 'expand_more' : 'expand_less'" color="indigo-9"
                      :aria-label="`${scrumCriterionTasksHidden(story, criterion) ? 'Show' : 'Hide'} tasks for this acceptance criterion`"
                      @click="toggleScrumCriterionTasks(story, criterion)">
                      <q-tooltip>{{ scrumCriterionTasksHidden(story, criterion) ? 'Show Tasks' : 'Hide Tasks' }}</q-tooltip>
                    </q-btn>
                  </div>
                  <div v-if="scrumReviewTasksFor(story, criterion).length && !scrumCriterionTasksHidden(story, criterion)" class="scrum-review-page__linked-tasks">
                    <div v-for="task in scrumReviewTasksFor(story, criterion)" :key="task.id" class="scrum-review-page__linked-task">
                      <span class="scrum-planner__trace-task-code">{{ task.id }}</span>
                      <span class="col"><strong>{{ task.title }}</strong><small>{{ task.module }} · {{ task.category }}</small></span>
                      <span class="scrum-planner__review-state" :class="`is-${task.review}`">{{ scrumReviewLabel(task.review) }}</span>
                      <q-btn flat dense round icon="visibility" color="indigo-9" :aria-label="`View task ${task.id}`" @click="scrumPreviewOrigin = 'review'; viewScrumGeneratedTask(task)"><q-tooltip>View Task</q-tooltip></q-btn>
                      <q-btn flat dense round icon="edit" color="indigo-9" :aria-label="`Edit task ${task.id}`" @click="editScrumGeneratedTask(task)"><q-tooltip>Edit Task</q-tooltip></q-btn>
                      <q-btn flat dense round icon="delete_outline" color="negative" :aria-label="`Remove task ${task.id}`" @click="confirmRemoveScrumTask(task)"><q-tooltip>Remove Task</q-tooltip></q-btn>
                      <q-btn v-if="task.review !== 'approved'" flat dense round icon="check_circle_outline" color="positive"
                        :aria-label="`Approve task ${task.id}`" @click="setScrumReview(task, 'approved')"><q-tooltip>Approve Task</q-tooltip></q-btn>
                    </div>
                  </div>
                </div>
              </q-card-section>
            </q-expansion-item>
          </template>
          <template v-else>
            <div class="scrum-review-page__module-tools">
              <div class="scrum-review-page__category-switch" role="group" aria-label="Filter generated tasks by development category">
                <q-btn v-for="category in scrumCategoryFilters" :key="category" dense no-caps unelevated
                  class="scrum-review-page__category-button" :class="{ 'is-active': scrumReviewCategoryFilter === category }"
                  :label="category === 'All Categories' ? 'All Tasks' : category"
                  :aria-pressed="scrumReviewCategoryFilter === category"
                  @click="scrumReviewCategoryFilter = category" />
              </div>
              <div class="scrum-review-page__expand-actions">
                <span>{{ scrumReviewModules.length }} modules · {{ scrumReviewVisibleTasks.length }} tasks</span>
                <q-btn flat dense no-caps icon="unfold_more" label="Expand all" color="indigo-9" @click="setAllScrumModulesExpanded(true)" />
                <q-btn flat dense no-caps icon="unfold_less" label="Collapse all" color="indigo-9" @click="setAllScrumModulesExpanded(false)" />
              </div>
            </div>
            <q-expansion-item v-for="moduleName in scrumReviewModules" :key="moduleName"
              :model-value="Boolean(scrumExpandedModules[moduleName])"
              @update:model-value="scrumExpandedModules[moduleName] = $event"
              class="scrum-review-page__story scrum-review-page__module-card" header-class="text-weight-bold" expand-separator>
              <template #header>
                <q-item-section avatar><q-icon name="layers" color="indigo-8" /></q-item-section>
                <q-item-section><q-item-label class="scrum-review-page__module-name">{{ moduleName }}</q-item-label><q-item-label v-if="scrumModuleInfo[moduleName]?.description" caption>{{ scrumModuleInfo[moduleName]?.description }}</q-item-label><q-item-label caption>{{ scrumReviewModuleTasks(moduleName).filter(task => task.review === 'approved').length }} approved · {{ scrumReviewModuleTasks(moduleName).filter(task => task.review !== 'approved').length }} awaiting review</q-item-label></q-item-section>
                <q-item-section side><q-badge class="scrum-review-page__module-count">{{ scrumReviewModuleTasks(moduleName).length }} tasks</q-badge></q-item-section>
                <q-item-section side><q-btn flat dense round icon="edit" color="indigo-9" aria-label="Edit module" @click.stop="openScrumRequirementEditor('module', moduleName)"><q-tooltip>Edit Module</q-tooltip></q-btn></q-item-section>
              </template>
              <q-card-section class="q-pt-sm">
                <div v-if="scrumReviewModuleTasks(moduleName).length === 0" class="text-caption text-grey-7 q-pa-sm">No tasks in this module yet. Add a task from an acceptance criterion and select this module.</div>
                <div v-for="task in scrumReviewModuleTasks(moduleName)" :key="task.id" class="scrum-review-page__task">
                  <div class="scrum-review-page__task-top">
                    <span class="scrum-planner__trace-task-code">{{ task.id }}</span>
                    <div class="scrum-review-page__task-name"><strong>{{ task.title }}</strong><small><span class="scrum-review-page__category-tag">{{ task.category }}</span> {{ task.points }} pts · {{ task.estimatedHours > 0 ? `${task.estimatedHours} hrs · ` : '' }}{{ task.userStory }} / {{ task.acceptanceCriteria }}</small></div>
                    <span class="scrum-planner__review-state" :class="`is-${task.review}`">{{ scrumReviewLabel(task.review) }}</span>
                  </div>
                  <p>{{ task.description }}</p>
                  <div class="scrum-review-page__dependencies"><b>Dependencies:</b> {{ task.dependencies.length ? task.dependencies.join(', ') : 'None' }}</div>
                  <div class="scrum-review-page__actions">
                    <q-btn dense flat round color="indigo-9" icon="visibility" :aria-label="`View task ${task.id}`" @click="scrumPreviewOrigin = 'review'; viewScrumGeneratedTask(task)"><q-tooltip>View Task</q-tooltip></q-btn>
                    <q-btn dense flat round color="indigo-9" icon="edit" :aria-label="`Edit task ${task.id}`" @click="editScrumGeneratedTask(task)"><q-tooltip>Edit Task</q-tooltip></q-btn>
                    <q-btn dense flat round color="negative" icon="delete_outline" :aria-label="`Remove task ${task.id}`" @click="confirmRemoveScrumTask(task)"><q-tooltip>Remove Task</q-tooltip></q-btn>
                    <q-btn v-if="task.review !== 'approved'" dense flat round color="positive" icon="check_circle_outline" :aria-label="`Approve task ${task.id}`" @click="setScrumReview(task, 'approved')"><q-tooltip>Approve Task</q-tooltip></q-btn>
                  </div>
                </div>
              </q-card-section>
            </q-expansion-item>
          </template>
          <div v-if="scrumReviewVisibleTasks.length === 0 && (scrumReviewSearch.trim() || scrumReviewStatusFilter !== 'All Statuses' || scrumReviewCategoryFilter !== 'All Categories')" class="scrum-review-page__no-results">
            <q-icon name="search_off" size="38px" color="blue-grey-5" />
            <strong>No matching tasks</strong>
            <span>Try a different category, review status, or search term.</span>
            <q-btn flat no-caps color="indigo-9" label="Reset filters" @click="clearScrumReviewFilters" />
          </div>
        </div>
        <footer class="scrum-review-page__footer">
          <span>{{ approvedScrumTasks }} of {{ scrumTasks.length }} approved. All tasks must be approved before inviting stakeholders to Scrum Planning.</span>
          <div class="row q-gutter-sm">
            <q-btn flat no-caps label="Close Review" @click="scrumTaskReviewOpen = false" />
            <q-btn unelevated no-caps color="indigo-9" icon-right="arrow_forward" label="Next: Invite Stakeholders"
              :disable="!scrumReviewComplete" @click="proceedToScrumPlanning" />
          </div>
        </footer>
      </q-card>
    </q-dialog>

    <!-- Detailed task preview with linked requirement traceability. -->
    <q-dialog v-model="scrumViewOpen" maximized transition-show="slide-up" transition-hide="slide-down">
      <q-card class="scrum-task-preview">
        <template v-if="scrumViewTask">
          <header class="scrum-task-preview__header">
            <div>
              <q-btn flat dense no-caps icon="arrow_back"  :label="scrumPreviewOrigin === 'kanban' ? 'Back to Kanban' : 'Back to Tasks'" color="indigo-9" @click="scrumViewOpen = false" />
              <h2><q-icon name="fact_check" /> Task Preview</h2>
              <p>Task information and linked requirement traceability</p>
            </div>
            <q-btn flat round icon="close" aria-label="Close task preview" @click="scrumViewOpen = false" />
          </header>
          <div class="scrum-task-preview__columns">
            <section class="scrum-task-preview__left">
              <div class="scrum-task-preview__summary">
                <div class="scrum-task-preview__badges">
                  <span class="scrum-task-preview__task-id">{{ scrumViewTask.id }}</span>
                  <q-chip dense square color="blue-1" text-color="indigo-9" icon="terminal">{{ scrumViewTask.category }}</q-chip>
                  <q-chip dense square :color="scrumViewTask.review === 'approved' ? 'green-1' : 'orange-1'" :text-color="scrumViewTask.review === 'approved' ? 'green-9' : 'orange-9'" :icon="scrumViewTask.review === 'approved' ? 'check_circle' : 'schedule'">{{ scrumReviewLabel(scrumViewTask.review) }}</q-chip>
                  <q-chip dense square color="red-1" text-color="red-9" icon="flag">{{ scrumViewTask.priority }}</q-chip>
                </div>
                <h3>{{ scrumViewTask.title }}</h3>
                <p>{{ scrumViewTask.description }}</p>
              </div>
              <q-tabs v-model="scrumPreviewTab" dense align="left" active-color="indigo-9" indicator-color="indigo-9" class="scrum-task-preview__tabs" no-caps>
                <q-tab name="details" icon="list_alt" label="Task Details" />
                <q-tab name="technical" icon="computer" label="Technical Details" />
                <q-tab name="dependencies" icon="link" :label="`Dependencies (${scrumViewTask.dependencies.length})`" />
                <q-tab name="comments" icon="chat_bubble_outline" :label="`Comments (${scrumTaskComments[scrumViewTask.id]?.length || 0})`" />
                <q-tab name="attachments" icon="attach_file" :label="`Attachments (${scrumTaskAttachments[scrumViewTask.id]?.length || 0})`" />
                <q-tab name="activity" icon="history" label="Activity" />
              </q-tabs>
              <q-tab-panels v-model="scrumPreviewTab" animated class="scrum-task-preview__panels">
                <q-tab-panel name="details" class="q-pa-none">
                  <dl class="scrum-task-preview__detail-list">
                    <div><dt>Task ID</dt><dd>{{ scrumViewTask.id }}</dd></div>
                    <div><dt>Task Type</dt><dd>{{ scrumViewTask.category }}</dd></div>
                    <div><dt>Priority</dt><dd>{{ scrumViewTask.priority }}</dd></div>
                    <div><dt>Review Status</dt><dd>{{ scrumReviewLabel(scrumViewTask.review) }}</dd></div>
                    <div><dt>Assignee</dt><dd>{{ scrumAssigneeFor(scrumViewTask.id)?.name || 'Unassigned' }}</dd></div>
                    <div><dt>Story Points</dt><dd>{{ scrumViewTask.points }}</dd></div>
                    <div><dt>Estimated Hours</dt><dd>{{ scrumViewTask.estimatedHours > 0 ? `${scrumViewTask.estimatedHours} hours` : 'Not estimated' }}</dd></div>
                    <div><dt>Sprint</dt><dd>{{ scrumSprints.find(sprint => sprint.id === scrumViewTask?.sprintId)?.name || 'Not planned' }}</dd></div>
                    <div><dt>Description</dt><dd>{{ scrumViewTask.description }}</dd></div>
                  </dl>
                </q-tab-panel>
                <q-tab-panel name="technical" class="q-pa-none">
                  <dl class="scrum-task-preview__detail-list">
                    <div><dt>Discipline</dt><dd>{{ scrumViewTask.category }}</dd></div>
                    <div><dt>Module</dt><dd>{{ scrumViewTask.module }}</dd></div>
                    <div><dt>Implementation</dt><dd>{{ scrumViewTask.description }}</dd></div>
                    <div><dt>Originating source</dt><dd>{{ scrumViewTask.source }}</dd></div>
                  </dl>
                </q-tab-panel>
                <q-tab-panel name="dependencies" class="q-pa-none">
                  <section class="scrum-dependency-diagram" aria-label="Task dependency diagram">
                    <header class="scrum-dependency-diagram__header">
                      <div class="scrum-dependency-diagram__title"><q-icon name="device_hub" color="deep-purple-7" size="20px" /><strong>Dependency Diagram</strong></div>
                      <div class="scrum-dependency-diagram__legend">
                        <span><i class="scrum-dependency-diagram__line scrum-dependency-diagram__line--pre" /> Depends On</span>
                        <span><i class="scrum-dependency-diagram__line scrum-dependency-diagram__line--post" /> Depended On By</span>
                      </div>
                    </header>
                    <div class="scrum-dependency-diagram__scroll">
                      <div class="scrum-dependency-diagram__graph">
                        <section class="scrum-dependency-diagram__branch scrum-dependency-diagram__branch--pre" aria-label="Prerequisite tasks">
                          <div class="scrum-dependency-diagram__branch-label">Prerequisites ({{ scrumViewPredecessorTasks.length }})</div>
                          <button v-for="task in scrumViewPredecessorTasks" :key="task.id" type="button" class="scrum-dependency-diagram__node scrum-dependency-diagram__node--linked" @click="viewScrumGeneratedTask(task)">
                            <span class="scrum-dependency-diagram__node-head"><strong>{{ task.id }}</strong><small>{{ task.category }}</small></span>
                            <span class="scrum-dependency-diagram__node-title">{{ task.title }}</span>
                            <span class="scrum-dependency-diagram__node-status">{{ scrumDependencyKanbanState(task.id).label }}</span>
                          </button>
                          <div v-if="!scrumViewPredecessorTasks.length" class="scrum-dependency-diagram__none">No prerequisites</div>
                        </section>
                        <div class="scrum-dependency-diagram__connector scrum-dependency-diagram__connector--pre" aria-hidden="true"><span /></div>
                        <section class="scrum-dependency-diagram__center" aria-label="Selected task">
                          <div class="scrum-dependency-diagram__branch-label">Selected task</div>
                          <div class="scrum-dependency-diagram__node scrum-dependency-diagram__node--current">
                            <span class="scrum-dependency-diagram__node-head"><strong>{{ scrumViewTask.id }}</strong><small>{{ scrumViewTask.category }}</small></span>
                            <span class="scrum-dependency-diagram__node-title">{{ scrumViewTask.title }}</span>
                            <span class="scrum-dependency-diagram__node-status">{{ scrumDependencyKanbanState(scrumViewTask.id).label }}</span>
                          </div>
                        </section>
                        <div class="scrum-dependency-diagram__connector scrum-dependency-diagram__connector--post" aria-hidden="true"><span /></div>
                        <section class="scrum-dependency-diagram__branch scrum-dependency-diagram__branch--post" aria-label="Dependent tasks">
                          <div class="scrum-dependency-diagram__branch-label">Dependent tasks ({{ scrumViewSuccessorTasks.length }})</div>
                          <button v-for="task in scrumViewSuccessorTasks" :key="task.id" type="button" class="scrum-dependency-diagram__node scrum-dependency-diagram__node--linked" @click="viewScrumGeneratedTask(task)">
                            <span class="scrum-dependency-diagram__node-head"><strong>{{ task.id }}</strong><small>{{ task.category }}</small></span>
                            <span class="scrum-dependency-diagram__node-title">{{ task.title }}</span>
                            <span class="scrum-dependency-diagram__node-status">{{ scrumDependencyKanbanState(task.id).label }}</span>
                          </button>
                          <div v-if="!scrumViewSuccessorTasks.length" class="scrum-dependency-diagram__none">No dependent tasks</div>
                        </section>
                      </div>
                    </div>
                    <p class="scrum-dependency-diagram__hint"><q-icon name="info_outline" /> Select a connected task to view its dependencies. Statuses reflect Kanban; unscheduled tasks show Not planned.</p>
                  </section>
                </q-tab-panel>
                <q-tab-panel name="comments" class="q-pa-none">
                  <section class="scrum-preview-collab">
                    <div class="scrum-preview-collab__heading"><strong>Task Comments</strong><span>{{ scrumTaskComments[scrumViewTask.id]?.length || 0 }} comments</span></div>
                    <div v-if="!scrumTaskComments[scrumViewTask.id]?.length" class="scrum-preview-collab__empty">No comments yet. Add a note or update for this task.</div>
                    <div v-for="comment in scrumTaskComments[scrumViewTask.id] || []" :key="comment.id" class="scrum-preview-comment">
                      <q-avatar size="30px" color="indigo-1" text-color="indigo-9" icon="person" />
                      <div class="scrum-preview-comment__content">
                        <div class="scrum-preview-comment__meta"><strong>{{ comment.author }}</strong><span>{{ formatScrumCommentDate(comment.createdAt) }}</span></div>
                        <div class="scrum-preview-comment__rich" v-html="sanitizeScrumCommentHtml(comment.html)" />
                        <div class="scrum-preview-comment__reactions" aria-label="Comment reactions">
                          <q-btn v-for="emoji in scrumCommentReactions" :key="emoji" dense no-caps unelevated
                            :outline="!comment.reactions.includes(emoji)" :color="comment.reactions.includes(emoji) ? 'indigo-2' : 'grey-3'"
                            text-color="indigo-9" class="scrum-preview-comment__reaction"
                            :aria-label="`${comment.reactions.includes(emoji) ? 'Remove' : 'Add'} ${emoji} reaction`"
                            :aria-pressed="comment.reactions.includes(emoji)"
                            @click="toggleScrumCommentReaction(scrumViewTask.id, comment.id, emoji)">
                            {{ emoji }} <span v-if="comment.reactions.includes(emoji)">1</span>
                            <q-tooltip>{{ comment.reactions.includes(emoji) ? 'Remove reaction' : 'React to comment' }}</q-tooltip>
                          </q-btn>
                        </div>
                      </div>
                      <q-btn flat round dense color="negative" icon="delete_outline" aria-label="Remove comment" @click="removeScrumComment(scrumViewTask.id, comment.id)"><q-tooltip>Remove comment</q-tooltip></q-btn>
                    </div>
                    <div class="scrum-comment-editor q-mt-md" @paste.capture="onScrumCommentPaste">
                      <div class="scrum-comment-editor__label">Write a comment</div>
                      <q-editor
                        ref="scrumCommentEditor"
                        v-model="scrumCommentDraft"
                        min-height="130px"
                        placeholder="Add an update, use bullet points, or paste a screenshot (Ctrl+V)..."
                        :toolbar="[['bold', 'italic', 'underline', 'strike'], ['unordered', 'ordered'], ['quote', 'link'], ['undo', 'redo']]"
                        :definitions="{ link: { icon: 'link', tip: 'Insert link' } }"
                        class="scrum-comment-editor__input"
                      />
                      <div class="scrum-comment-editor__extras">
                        <q-btn flat dense no-caps icon="sentiment_satisfied_alt" label="Emoji" color="indigo-8" aria-label="Insert emoji in comment">
                          <q-menu anchor="bottom left" self="top left">
                            <div class="scrum-comment-emoji-picker" aria-label="Choose an emoji">
                              <q-btn v-for="emoji in scrumCommentEmojis" :key="emoji" flat round dense :label="emoji"
                                :aria-label="`Insert ${emoji}`" @click="insertScrumCommentEmoji(emoji)"><q-tooltip>{{ emoji }}</q-tooltip></q-btn>
                            </div>
                          </q-menu>
                        </q-btn>
                        <span class="scrum-comment-editor__hint"><q-icon name="image" size="16px" /> Paste images with Ctrl+V (max 2 MB). Use toolbar buttons for lists and formatting.</span>
                      </div>
                    </div>
                    <div class="row justify-end q-mt-sm"><q-btn unelevated no-caps color="indigo-9" icon="send" label="Post Comment" :disable="!scrumCommentHasContent" @click="addScrumComment(scrumViewTask.id)" /></div>
                    <small class="scrum-preview-collab__notice">Comments are stored only in this browser session, not on the server.</small>
                  </section>
                </q-tab-panel>
                <q-tab-panel name="attachments" class="q-pa-none">
                  <section class="scrum-preview-collab">
                    <div class="scrum-preview-collab__heading"><strong>Task Attachments</strong><span>{{ scrumTaskAttachments[scrumViewTask.id]?.length || 0 }} files</span></div>
                    <div v-if="!scrumTaskAttachments[scrumViewTask.id]?.length" class="scrum-preview-collab__empty">No attachments yet. Select files to add to this task.</div>
                    <div v-for="file in scrumTaskAttachments[scrumViewTask.id] || []" :key="file.id" class="scrum-preview-file">
                      <q-icon name="insert_drive_file" color="indigo-8" size="23px" />
                      <div class="scrum-preview-file__info"><strong>{{ file.file.name }}</strong><small>{{ formatScrumFileSize(file.file.size) }}</small></div>
                      <q-btn flat dense round icon="download" color="indigo-9" aria-label="Download attachment" @click="downloadScrumAttachment(file.file)"><q-tooltip>Download</q-tooltip></q-btn>
                      <q-btn flat dense round icon="delete_outline" color="negative" aria-label="Remove attachment" @click="removeScrumAttachment(scrumViewTask.id, file.id)"><q-tooltip>Remove</q-tooltip></q-btn>
                    </div>
                    <label class="scrum-preview-upload"><q-icon name="upload_file" size="22px"/><span>Select files (max 10 MB each)</span><input type="file" multiple @change="onScrumFilesSelected($event, scrumViewTask.id)" /></label>
                    <small class="scrum-preview-collab__notice">Files are kept in browser memory only. They are not uploaded or available to other users.</small>
                  </section>
                </q-tab-panel>
                <q-tab-panel name="activity" class="q-pa-none">
                  <div class="scrum-task-preview__empty"><q-icon name="history" size="26px" /><p>Activity history is not available in the current frontend preview. Changes are not persisted.</p></div>
                </q-tab-panel>
              </q-tab-panels>
              <div class="scrum-task-preview__actions">
                <q-btn outline no-caps color="indigo-9" icon="edit" label="Edit Task" @click="editScrumGeneratedTask(scrumViewTask); scrumViewOpen = false" />
                <q-btn v-if="scrumViewTask.sprintId !== null" outline no-caps color="indigo-9" icon="view_kanban" label="View in Kanban" @click="openScrumPreviewKanban(scrumViewTask)" />
              </div>
            </section>
            <section class="scrum-task-preview__right">
              <div class="scrum-task-preview__trace-head"><q-icon name="track_changes" size="23px" /><strong>Requirement Traceability</strong><small>Task → Module → User Story → Acceptance Criteria</small></div>
              <div class="scrum-task-preview__timeline">
                <div class="scrum-task-preview__trace-node scrum-task-preview__trace-node--module">
                  <div class="scrum-task-preview__trace-marker"><q-icon name="layers" /></div>
                  <div class="scrum-task-preview__trace-label">Module</div>
                  <div class="scrum-task-preview__trace-card"><strong>{{ scrumViewTask.module }}</strong><small v-if="scrumModuleInfo[scrumViewTask.module]?.code">Code: {{ scrumModuleInfo[scrumViewTask.module]?.code }}</small><p>{{ scrumModuleInfo[scrumViewTask.module]?.description || 'Module containing this development task.' }}</p></div>
                </div>
                <div class="scrum-task-preview__trace-node scrum-task-preview__trace-node--story">
                  <div class="scrum-task-preview__trace-marker"><q-icon name="menu_book" /></div>
                  <div class="scrum-task-preview__trace-label">User Story</div>
                  <div class="scrum-task-preview__trace-card"><strong>{{ scrumViewTask.userStory }}</strong></div>
                </div>
                <div class="scrum-task-preview__trace-node scrum-task-preview__trace-node--criterion">
                  <div class="scrum-task-preview__trace-marker"><q-icon name="fact_check" /></div>
                  <div class="scrum-task-preview__trace-label">Acceptance Criteria</div>
                  <div class="scrum-task-preview__trace-card">
                    <div v-for="(criterion, index) in scrumCriteriaCatalog[scrumViewTask.userStory] || [scrumViewTask.acceptanceCriteria]" :key="`${index}-${criterion}`" class="scrum-task-preview__criterion" :class="{ 'is-linked': criterion === scrumViewTask.acceptanceCriteria }">
                      <span>AC-{{ String(index + 1).padStart(2, '0') }}</span>
                      <p>{{ criterion }}</p>
                      <q-icon v-if="criterion === scrumViewTask.acceptanceCriteria" name="check_circle" color="positive" size="18px"><q-tooltip>This task directly supports this criterion</q-tooltip></q-icon>
                    </div>
                    <small class="scrum-task-preview__criterion-note"><q-icon name="check_circle" color="positive" /> Checked criteria are directly linked to this task.</small>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </template>
        <template v-else>
          <q-card-section class="row items-center justify-between"><div class="text-h6">Acceptance Criterion</div><q-btn flat round icon="close" v-close-popup /></q-card-section>
          <q-separator />
          <q-card-section class="q-gutter-md">
            <div><b>User Story:</b> {{ scrumViewStory }}</div>
            <div><b>Acceptance Criterion:</b> {{ scrumViewCriterion }}</div>
            <div><b>Linked tasks:</b> {{ scrumReviewTasksFor(scrumViewStory, scrumViewCriterion).length }}</div>
            <q-list bordered separator><q-item v-for="task in scrumReviewTasksFor(scrumViewStory, scrumViewCriterion)" :key="task.id"><q-item-section><q-item-label>{{ task.id }} · {{ task.title }}</q-item-label><q-item-label caption>{{ task.module }} · {{ task.category }}</q-item-label></q-item-section></q-item></q-list>
          </q-card-section>
          <q-card-actions align="right"><q-btn flat no-caps label="Close" v-close-popup /></q-card-actions>
        </template>
      </q-card>
    </q-dialog>

    <!-- Dedicated User Story form with a live story preview and editable acceptance criteria. -->
    <q-dialog v-model="scrumStoryCreateOpen" persistent>
      <q-card class="scrum-creation-dialog" style="width: 680px; max-width: 96vw">
        <q-form @submit.prevent="saveScrumStoryCreator">
          <q-card-section class="row items-center justify-between">
            <div class="row items-center q-gutter-sm">
              <q-icon name="menu_book" size="26px" color="indigo-9" />
              <div><div class="text-h6 text-weight-bold">Add User Story</div><div class="text-caption text-grey-7">ONE ICTMS / Requirements Management</div></div>
            </div>
            <q-btn flat round icon="close" aria-label="Close Add User Story" @click="scrumStoryCreateOpen = false" />
          </q-card-section>
          <q-separator />
          <q-card-section class="scroll q-gutter-md" style="max-height: 65vh">
            <q-input v-model.trim="scrumNewStoryTitle" outlined label="Story title *" placeholder="e.g., View Latest Highlights" :rules="[v => !!String(v || '').trim() || 'Required']" />
            <q-input v-model.trim="scrumNewStoryRole" outlined label="User role *" placeholder="e.g., Public User, Admin, Encoder" :rules="[v => !!String(v || '').trim() || 'Required']" />
            <q-input v-model.trim="scrumNewStoryGoal" outlined type="textarea" autogrow label="I want to... *" :rules="[v => !!String(v || '').trim() || 'Required']" />
            <q-input v-model.trim="scrumNewStoryBenefit" outlined type="textarea" autogrow label="So that... *" :rules="[v => !!String(v || '').trim() || 'Required']" />
            <div class="scrum-creation-dialog__preview">
              <strong>User Story Preview</strong>
              <p class="q-mb-none">{{ scrumNewStoryPreview }}</p>
            </div>
            <q-separator />
            <div class="row items-center justify-between">
              <strong>Acceptance Criteria</strong>
              <q-btn flat no-caps color="indigo-9" icon="add" label="Add Criteria" @click="scrumNewStoryCriteria.push('')" />
            </div>
            <div v-for="(criterion, index) in scrumNewStoryCriteria" :key="index" class="row items-start no-wrap q-gutter-sm">
              <q-input :model-value="criterion" @update:model-value="scrumNewStoryCriteria[index] = String($event || '')" outlined autogrow type="textarea" class="col" :label="`AC-${String(index + 1).padStart(2, '0')}`" placeholder="Define a testable acceptance criterion" />
              <q-btn flat round icon="delete_outline" color="negative" :disable="scrumNewStoryCriteria.length === 1" @click="scrumNewStoryCriteria.splice(index, 1)"><q-tooltip>Remove criterion</q-tooltip></q-btn>
            </div>
            <q-banner v-if="scrumStoryCreateError" rounded class="bg-red-1 text-negative">{{ scrumStoryCreateError }}</q-banner>
          </q-card-section>
          <q-separator />
          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat no-caps label="Clear" @click="resetScrumStoryCreator" />
            <q-btn flat no-caps label="Cancel" @click="scrumStoryCreateOpen = false" />
            <q-btn unelevated no-caps color="indigo-9" type="submit" icon="check" label="Add User Story" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- Dedicated Module form; existing requirement links and optional task are supported. -->
    <q-dialog v-model="scrumModuleCreateOpen" persistent>
      <q-card class="scrum-creation-dialog" style="width: 700px; max-width: 96vw">
        <q-form @submit.prevent="saveScrumModuleCreator">
          <q-card-section class="row items-center justify-between">
            <div class="row items-center q-gutter-sm">
              <q-icon name="layers" size="26px" color="indigo-9" />
              <div><div class="text-h6 text-weight-bold">Add Module</div><div class="text-caption text-grey-7">ONE ICTMS / Requirements &amp; Task Management</div></div>
            </div>
            <q-btn flat round icon="close" aria-label="Close Add Module" @click="scrumModuleCreateOpen = false" />
          </q-card-section>
          <q-separator />
          <q-card-section class="scroll q-gutter-md" style="max-height: 65vh">
            <q-input v-model.trim="scrumUnifiedNewModule" outlined label="Module name *" placeholder="e.g., Latest Highlights, User Management" :rules="[v => !!String(v || '').trim() || 'Required']" />
            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6"><q-input v-model.trim="scrumUnifiedModuleCode" outlined label="Module code" placeholder="e.g., MOD-001" /></div>
              <div class="col-12 col-sm-6"><q-select v-model="scrumUnifiedModuleStatus" outlined label="Status" :options="['Draft', 'Under Review', 'Approved']" /></div>
            </div>
            <q-input v-model.trim="scrumUnifiedModuleDescription" outlined type="textarea" autogrow label="Module description *" :rules="[v => !!String(v || '').trim() || 'Required']" />
            <q-separator />
            <div class="row items-center q-gutter-sm"><q-icon name="link" color="indigo-9" /><strong>Requirement Traceability</strong></div>
            <div class="text-caption text-grey-7">Optionally link this module to an existing User Story and Acceptance Criterion.</div>
            <q-select v-model="scrumUnifiedExistingStory" outlined clearable label="Linked User Story" :options="scrumStoryCatalog" @update:model-value="scrumUnifiedExistingCriterion = null" />
            <q-select v-model="scrumUnifiedExistingCriterion" outlined clearable :disable="!scrumUnifiedExistingStory" label="Linked Acceptance Criterion" :options="scrumUnifiedCriterionOptions" />
            <q-separator />
            <div class="row items-center justify-between">
              <div><strong>Module Tasks</strong><div class="text-caption text-grey-7">{{ scrumUnifiedAddTask ? '1 new task being prepared' : '0 tasks added' }}</div></div>
              <q-btn flat no-caps color="indigo-9" :icon="scrumUnifiedAddTask ? 'remove' : 'add'" :label="scrumUnifiedAddTask ? 'Remove Task' : 'Add Task'" @click="scrumUnifiedAddTask = !scrumUnifiedAddTask" />
            </div>
            <div v-if="scrumUnifiedAddTask" class="q-gutter-md">
              <q-input v-model.trim="scrumUnifiedTaskTitle" outlined label="Task title *" />
              <div class="row q-col-gutter-md">
                <div class="col-12 col-sm-6"><q-select v-model="scrumUnifiedTaskCategory" outlined label="Category" :options="['Frontend', 'Backend', 'DB', 'UI/UX']" /></div>
                <div class="col-12 col-sm-6"><q-select v-model="scrumUnifiedTaskPriority" outlined label="Priority" :options="['High', 'Medium', 'Low']" /></div>
              </div>
              <q-input v-model.trim="scrumUnifiedTaskDescription" outlined type="textarea" autogrow label="Task details *" />
              <div class="row q-col-gutter-md">
                <div class="col-12 col-sm-4"><q-input v-model.number="scrumUnifiedTaskPoints" type="number" min="1" max="100" outlined label="Story points *" /></div>
                <div class="col-12 col-sm-4"><q-input v-model.number="scrumUnifiedTaskEstimatedHours" type="number" min="0" step="0.5" outlined label="Estimated Hours" hint="0 = not estimated" /></div>
                <div class="col-12 col-sm-8"><q-select v-model="scrumUnifiedTaskDependencies" multiple use-chips clearable outlined emit-value map-options label="Task dependencies" :options="scrumTasks.map(task => ({ label: `${task.id} · ${task.title}`, value: task.id }))" /></div>
              </div>
              <div class="text-caption text-grey-7">New tasks start as Pending Review.</div>
            </div>
            <q-banner v-if="scrumUnifiedError" rounded class="bg-red-1 text-negative">{{ scrumUnifiedError }}</q-banner>
          </q-card-section>
          <q-separator />
          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat no-caps label="Clear" @click="resetScrumModuleCreator" />
            <q-btn flat no-caps label="Cancel" @click="scrumModuleCreateOpen = false" />
            <q-btn unelevated no-caps color="indigo-9" type="submit" icon="check" label="Add Module" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- Edit a user story, acceptance criterion, or module while preserving task traceability. -->
    <q-dialog v-model="scrumRequirementEditorOpen" persistent>
      <q-card style="width: 580px; max-width: 95vw">
        <q-card-section class="row items-center justify-between">
          <div class="text-h6">Edit {{ scrumRequirementKind === 'story' ? 'User Story' : scrumRequirementKind === 'criterion' ? 'Acceptance Criterion' : 'Module' }}</div>
          <q-btn flat round icon="close" @click="scrumRequirementEditorOpen = false" />
        </q-card-section>
        <q-form @submit.prevent="saveScrumRequirement">
          <q-card-section>
            <q-input v-model.trim="scrumRequirementDraft" outlined autofocus type="textarea" autogrow label="Description / Name *"
              :rules="[value => !!String(value || '').trim() || 'Required']" />
            <div class="text-caption text-grey-7 q-mt-sm">Related task links will be updated. Affected tasks will require approval again.</div>
            <q-banner v-if="scrumRequirementError" class="bg-red-1 text-negative q-mt-md" rounded>{{ scrumRequirementError }}</q-banner>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat no-caps label="Cancel" @click="scrumRequirementEditorOpen = false" />
            <q-btn unelevated no-caps color="indigo-9" type="submit" icon="save" label="Save Changes" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- Task editor: requirement links and implementation details remain visible and editable. -->
    <q-dialog v-model="scrumEditTaskOpen" persistent>
      <q-card class="scrum-task-editor">
        <q-card-section class="row items-center justify-between">
          <div><div class="text-h6 text-weight-bold">{{ scrumCreatingTask ? 'Add Task' : 'Edit Generated Task' }} · {{ scrumTaskDraft?.id }}</div>
            <div class="text-caption text-grey-7">{{ scrumCreatingTask ? 'This task will be linked to the selected acceptance criterion and start as Pending review.' : 'Editing a task returns it to Pending review.' }}</div></div>
          <q-btn flat round icon="close" @click="scrumEditTaskOpen = false" />
        </q-card-section>
        <q-separator />
        <q-form v-if="scrumTaskDraft" @submit.prevent="saveScrumGeneratedTask">
          <q-card-section class="scrum-task-editor__fields">
            <q-input v-model.trim="scrumTaskDraft.title" outlined dense label="Task title *" :rules="[value => !!String(value || '').trim() || 'Required']" />
            <div class="scrum-task-editor__grid">
              <q-select v-model="scrumTaskDraft.category" outlined dense label="Discipline *" :options="['Frontend','Backend','DB','UI/UX']" />
              <q-select v-model="scrumTaskDraft.priority" outlined dense label="Priority" :options="['High','Medium','Low']" />
            </div>
            <q-select v-model="scrumTaskDraft.userStory" outlined dense label="Linked User Story *" :options="scrumUserStories" :disable="scrumCreatingTask" @update:model-value="onScrumDraftStoryChanged" />
            <q-select v-model="scrumTaskDraft.acceptanceCriteria" outlined dense label="Acceptance Criteria *" :options="scrumDraftCriteriaOptions" :disable="scrumCreatingTask" />
            <q-select v-model="scrumTaskDraft.module" outlined dense use-input fill-input hide-selected new-value-mode="add-unique" label="Module *" :options="scrumModuleCatalog" :rules="[value => !!String(value || '').trim() || 'Required']" />
            <q-input v-model.trim="scrumTaskDraft.description" type="textarea" autogrow outlined dense label="Task Details *" :rules="[value => !!String(value || '').trim() || 'Required']" />
            <q-select v-model="scrumTaskDraft.dependencies" multiple use-chips clearable outlined dense emit-value map-options label="Task Dependencies"
              :options="scrumDependencyOptions" hint="Only other tasks can be selected. Dependency loops are rejected." />
            <div class="scrum-task-editor__grid">
              <q-input v-model.number="scrumTaskDraft.points" type="number" min="1" max="100" outlined dense label="Story Points *" :rules="[value => Number(value) >= 1 && Number(value) <= 100 || 'Enter 1–100']" />
              <q-input v-model.number="scrumTaskDraft.estimatedHours" type="number" min="0" step="0.5" outlined dense label="Estimated Hours" hint="0 = not estimated" :rules="[value => Number.isFinite(Number(value)) && Number(value) >= 0 || 'Enter 0 or more hours']" />
            </div>
            <q-banner v-if="scrumEditTaskError" rounded class="bg-red-1 text-negative">{{ scrumEditTaskError }}</q-banner>
          </q-card-section>
          <q-separator />
          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat no-caps label="Cancel" @click="scrumEditTaskOpen = false" />
            <q-btn type="submit" unelevated no-caps color="indigo-9" :icon="scrumCreatingTask ? 'add' : 'save'" :label="scrumCreatingTask ? 'Add Task' : 'Save Changes'" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- FRONTEND-ONLY PREVIEW: AI tasks and sprint planning are local UI examples, not persisted. -->
    <q-dialog v-model="scrumPlanningOpen" persistent maximized transition-show="slide-up" transition-hide="slide-down">
      <q-card class="scrum-planner">
        <header class="scrum-planner__header">
          <div class="scrum-planner__identity">
            <div class="scrum-planner__mark"><q-icon name="auto_awesome" size="26px" /></div>
            <div>
              <div class="scrum-planner__eyebrow">ONE ICTMS <span> / </span> PROJECT DELIVERY</div>
              <h2>Scrum Planning</h2>
              <p>Review document-aligned tasks and organize approved work into sprints.</p>
            </div>
          </div>
          <div class="scrum-planner__header-actions">
            <q-btn flat no-caps color="white" icon="fact_check" label="Review Tasks" @click="returnToScrumTaskReview" />
            <q-badge class="scrum-planner__preview-badge">UI PREVIEW · NO TASKS SAVED</q-badge>
            <q-btn flat round icon="close" color="white" aria-label="Close Scrum planning" @click="scrumPlanningOpen = false" />
          </div>
        </header>

        <div class="scrum-planner__overview">
          <div class="scrum-planner__project">
            <span class="scrum-planner__project-icon"><q-icon name="dns" size="24px" /></span>
            <div><small>ACTIVE SYSTEM</small><strong>{{ form.system_name || 'Unnamed System' }}</strong><span>{{ form.alias || 'Information System' }}</span></div>
          </div>
          <div class="scrum-planner__metric"><q-icon name="task_alt" /><div><strong>{{ scrumTasks.length }}</strong><span>Development tasks</span></div></div>
          <div class="scrum-planner__metric"><q-icon name="fact_check" /><div><strong>{{ reviewedScrumTasks }}</strong><span>Evaluated</span></div></div>
          <div class="scrum-planner__metric"><q-icon name="view_kanban" /><div><strong>{{ scheduledScrumTasks }}</strong><span>In sprint plan</span></div></div>
          <div class="scrum-planner__metric"><q-icon name="description" /><div><strong>4</strong><span>Source document types</span></div></div>
        </div>

        <div class="scrum-planner__workspace">
          <section class="scrum-planner__column scrum-planner__column--sprint" aria-labelledby="scrum-sprint-title">
            <div class="scrum-planner__column-head">
              <div class="scrum-planner__column-title"><span class="scrum-planner__column-icon scrum-planner__column-icon--sprint"><q-icon name="view_kanban" size="22px" /></span>
                <div><h3 id="scrum-sprint-title">Sprint Plan</h3><p>Project Manager / Scrum Master workspace</p></div>
              </div>
              <q-btn round flat dense icon="add" color="indigo-9" aria-label="Add sprint" @click="addScrumSprint"><q-tooltip>Add sprint</q-tooltip></q-btn>
            </div>
            <div class="scrum-planner__sprint-tabs" role="group" aria-label="Available sprints">
              <button v-for="sprint in scrumSprints" :key="sprint.id" type="button" class="scrum-planner__sprint-tab"
                :class="{ 'is-selected': activeSprintId === sprint.id }" @click="activeSprintId = sprint.id">{{ sprint.name }} <span>{{ countScrumSprintTasks(sprint.id) }}</span></button>
            </div>
            <div class="scrum-planner__sprint-summary">
              <div class="scrum-planner__sprint-label"><span>SELECTED SPRINT</span><strong>{{ activeScrumSprintName }}</strong></div>
              <div v-if="activeScrumSprint" class="scrum-planner__sprint-dates">
                <q-input v-model="activeScrumSprint.startDate" outlined dense type="date" stack-label label="Start date" aria-label="Sprint start date" :max="activeScrumSprint.endDate || undefined" />
                <q-input v-model="activeScrumSprint.endDate" outlined dense type="date" stack-label label="End date" aria-label="Sprint end date" :min="activeScrumSprint.startDate || undefined" />
              </div>
              <div class="scrum-planner__sprint-effort"><span>ESTIMATED EFFORT</span><strong>{{ activeScrumSprintPoints }} story points</strong><small>{{ activeScrumSprintHours > 0 ? `${activeScrumSprintHours} estimated hours` : 'Hours not estimated' }}</small></div>
            </div>
            <q-banner v-if="scrumManagingOfficeError" dense class="bg-orange-1 text-orange-10 q-mx-md q-my-sm" rounded>
              {{ scrumManagingOfficeError }}
            </q-banner>
            <div class="scrum-planner__dropzone" :class="{ 'is-over': scrumDropOver }" @dragover.prevent="scrumDropOver = true" @dragleave="scrumDropOver = false" @drop.prevent="onScrumDropToSprint">
              <div v-if="activeScrumSprintTasks.length === 0" class="scrum-planner__drop-hint">
                <span class="scrum-planner__drop-icon"><q-icon name="move_to_inbox" size="35px" /></span>
                <strong>Build your sprint backlog</strong><p>Approve eligible tasks first, then drag them here or select <b>Plan</b>.</p>
                <span>Review decisions stay visible on each task.</span>
              </div>
              <section v-for="group in activeScrumSprintModules" :key="group.module" class="scrum-plan-module-card scrum-plan-sprint-card">
                <div class="scrum-plan-module-header scrum-plan-sprint-module-title"
                  draggable="true"
                  :aria-label="`Drag ${group.module} module back to backlog`"
                  @dragstart.stop="onScrumModuleDragStart($event, group.module, 'sprint')"
                  @dragend="clearScrumDrag()">
                  <q-icon name="drag_indicator" size="19px" class="scrum-plan-module-drag-handle" />
                  <q-icon name="layers" size="21px" color="indigo-8" />
                  <span class="scrum-plan-module-name">{{ group.module }}</span>
                  <span class="scrum-plan-module-count">{{ group.tasks.length }} task{{ group.tasks.length === 1 ? '' : 's' }}</span>
                  <q-tooltip>Drag this module back to the task backlog</q-tooltip>
                </div>
                <div class="scrum-plan-module-tasks">
                  <article v-for="task in group.tasks" :key="task.id" class="scrum-plan-task-row"
                    draggable="true" @dragstart.stop="onScrumDragStart($event, task.id)" @dragend="clearScrumDrag()">
                    <span class="scrum-plan-task-code">{{ task.id }}</span>
                    <div class="scrum-plan-task-copy">
                      <strong>{{ task.title }}</strong>
                      <span>{{ task.category }} · {{ task.points }} pts · {{ task.estimatedHours > 0 ? `${task.estimatedHours} hrs · ` : '' }}{{ task.priority }} priority</span>
                      <span v-if="task.dependencies.length">Dependencies: {{ task.dependencies.join(', ') }}</span>
                    </div>
                    <div class="scrum-assignee" @mousedown.stop @dragstart.stop>
                      <q-btn
                        no-caps unelevated
                        class="scrum-assignee__trigger"
                        :class="{ 'scrum-assignee__trigger--assigned': scrumTaskAssignees[task.id] != null }"
                        :disable="scrumManagingOfficeLoading || scrumManagingOfficeUsers.length === 0"
                        :aria-label="`Assign ${task.id} to a Managing Office member`"
                      >
                        <q-avatar size="26px" class="scrum-assignee__avatar"
                          :class="{ 'scrum-assignee__avatar--assigned': scrumTaskAssignees[task.id] != null }">
                          {{ scrumAssigneeFor(task.id) ? userInitials(scrumAssigneeFor(task.id)?.name || '') : '+' }}
                        </q-avatar>
                        <span class="scrum-assignee__copy">
                          <small>{{ scrumTaskAssignees[task.id] != null ? 'Assigned to' : 'Task owner' }}</small>
                          <strong>{{ scrumAssigneeFor(task.id)?.name || 'Assign member' }}</strong>
                        </span>
                        <q-icon name="keyboard_arrow_down" size="19px" class="scrum-assignee__arrow" />
                        <q-menu anchor="bottom right" self="top right" :offset="[0, 6]"
                          class="scrum-assignee__menu" @show="scrumAssigneeSearch = ''">
                          <div class="scrum-assignee__menu-head">
                            <strong>Assign task · {{ task.id }}</strong>
                            <span>Managing Office members</span>
                          </div>
                          <q-input v-model="scrumAssigneeSearch" dense outlined clearable autofocus
                            placeholder="Search name or email" class="scrum-assignee__search">
                            <template #prepend><q-icon name="search" size="18px" /></template>
                          </q-input>
                          <q-list class="scrum-assignee__options">
                            <q-item v-for="person in filteredScrumAssignees" :key="person.id"
                              clickable v-close-popup
                              :active="scrumTaskAssignees[task.id] === person.id"
                              active-class="scrum-assignee__option--selected"
                              @click="setScrumTaskAssignee(task.id, person.id)">
                              <q-item-section avatar>
                                <q-avatar size="32px" color="indigo-1" text-color="indigo-9">{{ userInitials(person.name) }}</q-avatar>
                              </q-item-section>
                              <q-item-section>
                                <q-item-label class="text-weight-medium">{{ person.name }}</q-item-label>
                                <q-item-label caption>{{ person.email || 'No email provided' }}</q-item-label>
                              </q-item-section>
                              <q-item-section side v-if="scrumTaskAssignees[task.id] === person.id">
                                <q-icon name="check_circle" color="positive" size="19px" />
                              </q-item-section>
                            </q-item>
                            <q-item v-if="!filteredScrumAssignees.length">
                              <q-item-section class="text-grey-7 text-caption">No matching members found.</q-item-section>
                            </q-item>
                          </q-list>
                          <template v-if="scrumTaskAssignees[task.id] != null">
                            <q-separator />
                            <q-item clickable v-close-popup class="text-negative"
                              @click="setScrumTaskAssignee(task.id, null)">
                              <q-item-section avatar><q-icon name="person_remove" /></q-item-section>
                              <q-item-section>Unassign task</q-item-section>
                            </q-item>
                          </template>
                        </q-menu>
                      </q-btn>
                      <q-tooltip v-if="scrumManagingOfficeUsers.length === 0">
                        {{ scrumManagingOfficeLoading ? 'Loading Managing Office users' : 'No Managing Office members available' }}
                      </q-tooltip>
                    </div>
                    <q-btn flat dense round icon="info_outline" color="indigo-8" aria-label="View task details"
                      @click="expandedScrumTaskId = expandedScrumTaskId === task.id ? null : task.id">
                      <q-tooltip>Task details</q-tooltip>
                    </q-btn>
                    <q-btn flat dense round icon="undo" color="indigo-8" aria-label="Return task to backlog"
                      @click="moveScrumTask(task.id, null)">
                      <q-tooltip>Return to backlog</q-tooltip>
                    </q-btn>
                    <div v-if="expandedScrumTaskId === task.id" class="scrum-plan-task-details">
                      <div>{{ task.description }}</div>
                      <div><b>Source:</b> {{ task.userStory }} / {{ task.acceptanceCriteria }}</div>
                      <div><b>Dependencies:</b> {{ task.dependencies.length ? task.dependencies.join(', ') : 'None' }}</div>
                    </div>
                  </article>
                </div>
              </section>
            </div>
            <div class="scrum-planner__sprint-footer"><q-icon name="verified_user" size="18px" /><span>Project Manager / Scrum Master review required before sprint execution.</span></div>
          </section>

          <section class="scrum-planner__column scrum-planner__column--suggestions" aria-labelledby="scrum-suggestions-title">
            <div class="scrum-planner__column-head">
              <div class="scrum-planner__column-title">
                <span class="scrum-planner__column-icon scrum-planner__column-icon--ai"><q-icon name="auto_awesome" size="22px" /></span>
                <div><h3 id="scrum-suggestions-title">Tasks</h3><p>Development backlog · approve before planning</p></div>
              </div>
              <q-badge class="scrum-planner__count">{{ unscheduledScrumTasks }} unplanned</q-badge>
            </div>
            <!-- Scrum Planning presents only Module -> Task. Requirement editing stays in the review step. -->
            <div class="scrum-plan-module-toolbar">
              <div class="scrum-plan-module-filters" role="group" aria-label="Filter tasks by development category">
                <button v-for="category in scrumCategoryFilters" :key="category" type="button"
                  class="scrum-planner__filter" :class="{ 'is-selected': scrumCategoryFilter === category }"
                  @click="scrumCategoryFilter = category">{{ category === 'All Categories' ? 'All Tasks' : category }}</button>
              </div>
              <div class="scrum-plan-module-tools">
                <span>{{ scrumBacklogModuleGroups.length }} modules · {{ visibleScrumSuggestions.length }} tasks</span>
              </div>
            </div>
            <div class="scrum-planner__task-list scrum-plan-module-list" @dragover.prevent @drop="onScrumDropToBacklog">
              <section v-for="group in scrumBacklogModuleGroups" :key="group.module" class="scrum-plan-module-card">
                <button type="button" class="scrum-plan-module-header"
                  :draggable="canPlanScrumModule(group.module)"
                  :aria-label="`Expand or drag ${group.module} module to sprint`"
                  :aria-expanded="scrumPlanningExpandedModules.includes(group.module)"
                  @click="toggleScrumModule(group.module)"
                  @dragstart.stop="onScrumModuleDragStart($event, group.module, 'backlog')"
                  @dragend="clearScrumDrag()">
                  <q-icon name="drag_indicator" size="19px" class="scrum-plan-module-drag-handle" />
                  <q-icon name="layers" size="21px" color="indigo-8" />
                  <span class="scrum-plan-module-name">{{ group.module }}</span>
                  <span class="scrum-plan-module-count">{{ group.tasks.length }} task{{ group.tasks.length === 1 ? '' : 's' }}</span>
                  <q-icon :name="scrumPlanningExpandedModules.includes(group.module) ? 'expand_less' : 'expand_more'" size="20px" color="grey-7" />
                  <q-tooltip>{{ canPlanScrumModule(group.module) ? 'Drag to plan every unplanned task in this module' : 'Approve all module tasks and their dependencies before dragging' }}</q-tooltip>
                </button>
                <div v-if="scrumPlanningExpandedModules.includes(group.module)" class="scrum-plan-module-tasks">
                  <article v-for="task in group.tasks" :key="task.id" class="scrum-plan-task-row"
                    :draggable="canPlanScrumTask(task)" @dragstart.stop="onScrumDragStart($event, task.id)" @dragend="clearScrumDrag()">
                    <span class="scrum-plan-task-code">{{ task.id }}</span>
                    <div class="scrum-plan-task-copy">
                      <strong>{{ task.title }}</strong>
                      <span>{{ task.category }} · {{ task.points }} pts · {{ task.estimatedHours > 0 ? `${task.estimatedHours} hrs · ` : '' }}{{ task.priority }} priority</span>
                      <span v-if="task.dependencies.length">Dependencies: {{ task.dependencies.join(', ') }}</span>
                    </div>
                    <q-btn flat dense round icon="info_outline" color="indigo-8" aria-label="View task details" @click="expandedScrumTaskId = expandedScrumTaskId === task.id ? null : task.id"><q-tooltip>Task details</q-tooltip></q-btn>
                    <q-btn flat dense round icon="add_circle_outline" color="indigo-8" aria-label="Add task to sprint" :disable="!canPlanScrumTask(task)" @click="moveScrumTask(task.id, activeSprintId)"><q-tooltip>Plan in {{ activeScrumSprintName }}</q-tooltip></q-btn>
                    <div v-if="expandedScrumTaskId === task.id" class="scrum-plan-task-details">
                      <div>{{ task.description }}</div>
                      <div><b>Dependencies:</b> {{ task.dependencies.length ? task.dependencies.join(', ') : 'None' }}</div>
                    </div>
                  </article>
                </div>
              </section>
              <div v-if="scrumBacklogModuleGroups.length === 0" class="scrum-planner__empty">
                <q-icon name="inventory_2" size="30px" />
                <strong>No unplanned tasks match this category</strong>
                <span>Try a different category, or return a task from the sprint backlog.</span>
              </div>
            </div>
          </section>
        </div>
        <footer class="scrum-planner__footer">
          <span><q-icon name="cloud_off" size="17px" /> Demo planning session · Changes are not saved</span>
          <div><q-btn flat no-caps color="indigo-9" label="Close Preview" @click="scrumPlanningOpen = false" />
            <q-btn unelevated no-caps color="indigo-9" icon-right="arrow_forward" label="Proceed to Kanban" :disable="scheduledScrumTasks === 0" @click="openScrumKanban" />
          </div>
        </footer>
      </q-card>
    </q-dialog>

    <!-- Step 4: Sprint execution Kanban; frontend-only until task status API is connected. -->
    <q-dialog v-model="scrumKanbanOpen" persistent maximized transition-show="slide-up" transition-hide="slide-down">
      <q-card class="scrum-kanban-page">
        <header class="scrum-planner__header">
          <div class="scrum-planner__identity">
            <div class="scrum-planner__mark"><q-icon name="view_kanban" size="26px" /></div>
            <div>
              <div class="scrum-planner__eyebrow">ONE ICTMS / PROJECT DELIVERY</div>
              <h2>Kanban Board</h2>
              <p>Track planned sprint tasks from To Do through Done.</p>
            </div>
          </div>
          <div class="scrum-planner__header-actions">
            <q-btn flat no-caps color="white" icon="arrow_back" label="Back to Sprint Plan" @click="returnToScrumPlanningFromKanban" />
            <q-badge class="scrum-planner__preview-badge">UI PREVIEW · NOT SAVED</q-badge>
            <q-btn flat round icon="close" color="white" aria-label="Close Kanban board" @click="scrumKanbanOpen = false" />
          </div>
        </header>
        <div class="scrum-kanban-toolbar">
          <div class="scrum-kanban-toolbar__filters">
            <q-select v-model="scrumKanbanSprintId" :options="scrumKanbanSprintOptions" label="Sprint" dense outlined emit-value map-options class="scrum-kanban-sprint" />
            <div class="scrum-kanban-dates" aria-label="Selected sprint date range">
              <q-icon name="date_range" size="20px" color="indigo-8" />
              <div class="scrum-kanban-date"><span>START DATE</span><strong>{{ formatScrumKanbanDate(scrumKanbanSelectedSprint?.startDate) }}</strong></div>
              <q-icon name="arrow_forward" size="16px" color="grey-6" class="scrum-kanban-date-arrow" />
              <div class="scrum-kanban-date"><span>END DATE</span><strong>{{ formatScrumKanbanDate(scrumKanbanSelectedSprint?.endDate) }}</strong></div>
            </div>
            <q-select v-model="scrumKanbanCategory" :options="scrumCategoryFilters" label="Category" dense outlined class="scrum-kanban-category" />
            <q-input v-model="scrumKanbanSearch" dense outlined clearable placeholder="Search task, module or assignee..." class="scrum-kanban-search">
              <template #prepend><q-icon name="search" /></template>
            </q-input>
          </div>
          <div class="scrum-kanban-toolbar__summary">
            <strong>{{ scrumKanbanSprintTasks.length }} tasks</strong>
            <span>{{ scrumKanbanCompletedCount }} done</span>
            <span>{{ scrumKanbanSprintPoints }} story points</span>
          </div>
        </div>
        <div class="scrum-kanban-board">
          <section v-for="column in scrumKanbanColumns" :key="column.id" class="scrum-kanban-column"
            :class="{ 'scrum-kanban-column--over': scrumKanbanHover === column.id }"
            @dragover.prevent="scrumKanbanHover = column.id" @dragleave="scrumKanbanHover = null" @drop.prevent="onScrumKanbanDrop($event, column.id)">
            <header class="scrum-kanban-column__head">
              <div><span class="scrum-kanban-column__dot" :class="`scrum-kanban-column__dot--${column.id}`" /><strong>{{ column.label }}</strong></div>
              <span class="scrum-kanban-column__count">{{ scrumKanbanTasksInColumn(column.id).length }}</span>
            </header>
            <div class="scrum-kanban-column__cards">
              <article v-for="task in scrumKanbanTasksInColumn(column.id)" :key="task.id" class="scrum-kanban-task"
                draggable="true" @dragstart="onScrumKanbanDragStart($event, task.id)" @dragend="scrumKanbanDraggingId = null">
                <div class="scrum-kanban-task__top">
                  <span class="scrum-plan-task-code">{{ task.id }}</span>
                  <span class="scrum-kanban-task__priority">{{ task.priority }}</span>
                </div>
                <strong class="scrum-kanban-task__title">{{ task.title }}</strong>
                <span class="scrum-kanban-task__module"><q-icon name="layers" size="14px" /> {{ task.module }}</span>
                <div class="scrum-kanban-task__meta"><span>{{ task.category }}</span><span>{{ task.points }} pts{{ task.estimatedHours > 0 ? ` · ${task.estimatedHours} hrs` : '' }}</span></div>
                <div v-if="task.dependencies.length" class="scrum-kanban-task__deps">Depends on: {{ task.dependencies.join(', ') }}</div>
                <div class="scrum-kanban-task__footer">
                  <span class="scrum-kanban-task__owner"><q-icon name="person_outline" size="16px" /> {{ scrumAssigneeFor(task.id)?.name || 'Unassigned' }}</span>
                  <q-btn flat dense round icon="info_outline" color="indigo-8" :aria-label="`View ${task.id} details`" @click="openScrumKanbanTaskPreview(task)"><q-tooltip>View task details</q-tooltip></q-btn>
                </div>
              </article>
              <div v-if="scrumKanbanTasksInColumn(column.id).length === 0" class="scrum-kanban-empty">Drop tasks here</div>
            </div>
          </section>
        </div>
        <footer class="scrum-planner__footer">
          <span><q-icon name="cloud_off" size="17px" /> Kanban statuses are local to this session · Not saved</span>
          <q-btn flat no-caps color="indigo-9" icon="arrow_back" label="Back to Sprint Plan" @click="returnToScrumPlanningFromKanban" />
        </footer>
      </q-card>
    </q-dialog>
    <!-- Step 2: stakeholder email invitation before sprint planning and task assignment. -->
    <q-dialog v-model="scrumTeamAssignmentOpen" persistent maximized transition-show="slide-up" transition-hide="slide-down">
      <q-card class="scrum-team-page">
        <header class="scrum-planner__header">
          <div class="scrum-planner__identity">
            <div class="scrum-planner__mark"><q-icon name="groups" size="26px" /></div>
            <div><div class="scrum-planner__eyebrow">ONE ICTMS / PROJECT DELIVERY</div>
              <h2>Invite Stakeholders to Sprint Planning</h2>
              <p>Invite assigned stakeholders to discuss sprint planning and task assignment on Google Meet.</p></div>
          </div>
          <div class="scrum-planner__header-actions">
            <q-btn flat no-caps color="white" icon="arrow_back" label="Back to Task Review" @click="returnToReviewFromInvitation" />
            <q-btn flat round icon="close" color="white" aria-label="Close team assignment" @click="scrumTeamAssignmentOpen = false" />
          </div>
        </header>
        <div class="scrum-team-content">
          <q-banner rounded class="bg-blue-1 text-indigo-9 q-mb-md">
            Frontend preview: Stakeholders come from the System Registry. Removing an attendee affects this meeting only. Calendar invitations are not sent automatically.
          </q-banner>
          <div class="scrum-team-grid">
            <section class="scrum-team-panel">
              <div class="scrum-team-panel__head"><q-icon name="video_call" color="indigo-8" size="24px" /><strong>Google Meet Invitation</strong></div>
              <q-select v-model="scrumMeetingSprintId" :options="scrumMeetingSprintOptions" label="Proposed sprint to discuss" outlined emit-value map-options />
              <q-input v-model.trim="scrumMeetingTitle" outlined label="Meeting title" />
              <div class="scrum-team-row"><q-input v-model="scrumMeetingDate" type="date" outlined stack-label label="Meeting date" class="col" />
                <q-input v-model="scrumMeetingTime" type="time" outlined stack-label label="Start time" class="col" /></div>
              <q-input v-model="scrumMeetingDuration" type="number" min="15" max="480" outlined label="Duration (minutes)" />
              <q-input v-model.trim="scrumMeetingLink" outlined type="url" label="Google Meet link" placeholder="https://meet.google.com/abc-defg-hij" hint="Create a Google Meet, then paste its URL here." />
              <div class="row q-gutter-sm">
                <q-btn outline no-caps color="indigo-9" icon="video_call" label="Create Google Meet" @click="launchScrumGoogleMeet" />
                <q-btn unelevated no-caps color="indigo-9" icon="event" label="Prepare Calendar Invitation" :disable="!scrumMeetingReady" @click="launchScrumCalendarInvite" />
              </div>
              <div class="text-caption text-grey-7">Agenda: review approved tasks, agree on sprint scope, and discuss task ownership. The Calendar invitation opens as a draft; send it manually.</div>
            </section>
            <section class="scrum-team-panel">
              <div class="scrum-team-panel__head"><q-icon name="groups" color="indigo-8" size="24px" /><strong>System Stakeholders</strong><q-space />
                <q-badge color="indigo-1" text-color="indigo-9">{{ scrumAttendees.length }} invited</q-badge></div>
              <div class="text-caption text-grey-7">Only stakeholders assigned to this system are eligible. Remove anyone who should not receive this meeting invitation.</div>
              <div v-if="!scrumRegistryStakeholders.length" class="text-grey-7 q-pa-md text-center">No assigned stakeholders found. Add stakeholders in the System Registry first.</div>
              <section v-for="group in scrumStakeholdersByRole" :key="group.role" class="scrum-stakeholder-role-group">
                <div class="scrum-stakeholder-role-header">
                  <q-icon name="badge" color="indigo-8" size="20px" />
                  <strong>{{ group.role }}</strong>
                  <q-space />
                  <q-badge color="indigo-1" text-color="indigo-9">{{ group.people.length }} {{ group.people.length === 1 ? 'member' : 'members' }}</q-badge>
                </div>
                <div v-for="person in group.people" :key="`${person.id}-${person.role}`" class="scrum-stakeholder-row">
                  <q-avatar color="indigo-1" text-color="indigo-9" size="38px">{{ person.name.trim().slice(0, 1).toUpperCase() }}</q-avatar>
                  <div class="scrum-stakeholder-details"><strong>{{ person.name }}</strong>
                    <small :class="{ 'text-negative': !person.email }">{{ person.email || 'No email found — update the user directory to invite' }}</small></div>
                  <q-chip v-if="person.email && scrumAttendees.includes(person.email)" dense color="green-1" text-color="green-9">Included</q-chip>
                  <q-chip v-else-if="person.email" dense color="grey-2" text-color="grey-8">Excluded</q-chip>
                  <q-btn v-if="person.email && scrumAttendees.includes(person.email)" round flat dense icon="person_remove" color="negative" :aria-label="`Remove ${person.name} from invitation`" @click="removeScrumAttendee(person.email)"><q-tooltip>Remove from invitation</q-tooltip></q-btn>
                  <q-btn v-else-if="person.email" round flat dense icon="person_add" color="indigo-9" :aria-label="`Re-add ${person.name} to invitation`" @click="restoreScrumAttendee(person.email)"><q-tooltip>Re-add stakeholder</q-tooltip></q-btn>
                </div>
              </section>
              <div v-if="!scrumAttendees.length" class="text-caption text-orange-9">Select at least one stakeholder with a valid email before preparing an invitation.</div>
            </section>
          </div>
        </div>
        <footer class="scrum-planner__footer">
          <span><q-icon name="cloud_off" size="17px" /> Local preview · Invitations are not sent or saved</span>
          <div><q-btn flat no-caps color="indigo-9" label="Back to Task Review" @click="returnToReviewFromInvitation" />
            <q-btn unelevated no-caps color="indigo-9" icon="check_circle" label="Proceed to Scrum Planning" icon-right="arrow_forward" @click="continueToScrumPlanning" /></div>
        </footer>
      </q-card>
    </q-dialog>

    <q-dialog v-model="viewOpen"><q-card class="registry-dialog registry-dialog--wide">
      <q-card-section class="row items-center justify-between"><div class="text-h6 text-weight-bold">System Profile</div><q-btn flat round icon="close" v-close-popup /></q-card-section>
      <q-separator />
      <q-card-section v-if="selected" class="registry-details registry-form--scroll">
        <h3>{{ selected.system_name }}</h3><p>{{ selected.description || 'No description provided.' }}</p>
        <dl>
          <dt>Alias</dt><dd>{{ selected.alias || '—' }}</dd>
          <dt>Status</dt><dd>{{ statusLabel(selected.status) }}</dd>
          <dt>Business owner</dt><dd>{{ departmentLabel(selected.business_owner) }}</dd>
          <dt>Managing type</dt><dd>{{ library.labelFor('managingTypes', selected.desc?.managing_type) }}</dd>
          <dt>Managing office</dt><dd>{{ departmentLabel(selected.desc?.managing_office) }}</dd>
          <dt>Third party</dt><dd>{{ selected.desc?.third_party_company || '—' }}</dd>
          <dt>Roll-on</dt><dd>{{ selected.desc?.project_roll_on || '—' }}</dd>
          <dt>Sign-off</dt><dd>{{ selected.desc?.project_sign_off || '—' }}</dd>
          <dt>Duration</dt><dd>{{ selected.desc?.estimation_project_duration ?? '—' }}</dd>
          <dt>Solution type</dt><dd>{{ library.labelFor('developmentSolutionTypes', selected.repo?.development_solution_type) }}</dd>
          <dt>Git repo</dt><dd>{{ selected.repo?.repo_git || '—' }}</dd>
          <dt>Staging</dt><dd>{{ selected.repo?.staging_url || '—' }}</dd>
          <dt>Production</dt><dd>{{ selected.repo?.production_url || '—' }}</dd>
          <dt>Frontend</dt><dd>{{ stackNames(selected.tech_stack?.frontend_stack) }}</dd>
          <dt>Backend</dt><dd>{{ stackNames(selected.tech_stack?.backend_stack) }}</dd>
          <dt>Database</dt><dd>{{ selected.tech_stack?.database || '—' }}</dd>
          <dt>Server</dt><dd>{{ [selected.tech_stack?.server_type, selected.tech_stack?.server_name].filter(Boolean).join(' / ') || '—' }}</dd>
          <dt>Stakeholders</dt><dd>{{ stakeholderNames(selected.stakeholders) }}</dd>
          <dt>Documents</dt><dd>{{ documentNames(selected.docs) }}</dd>
          <dt>Updated</dt><dd>{{ formatDate(selected.updated_at) }}</dd>
        </dl>
      </q-card-section>
      <q-card-actions align="right"><q-btn flat no-caps label="Close" v-close-popup /></q-card-actions>
    </q-card></q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import RegistryDocumentRow from '@/components/registry/RegistryDocumentRow.vue'
import { useQuasar, type QTableColumn } from 'quasar'
import { registryApi } from '@/services/registry-api'
import { useLibraryStore } from '@/stores/library'
import { useAuthStore } from '@/stores/auth'
import { errorMessage } from '@/services/http'
import { libraryApi, type DepartmentUser, type LibraryOption } from '@/services/library-api'
import type { RegistryPayload, RegistryRecord } from '@/types/registry'

type RegistryRepositoryForm = NonNullable<RegistryPayload['repo']> & {
  frontend_repo_git?: string | null
  frontend_staging_url?: string | null
  frontend_production_url?: string | null
  backend_repo_git?: string | null
  backend_staging_url?: string | null
  backend_production_url?: string | null
}

type RegistryForm = Omit<RegistryPayload, 'status' | 'desc' | 'repo' | 'tech_stack' | 'stakeholders' | 'docs'> & {
  status: number | null
  desc: NonNullable<RegistryPayload['desc']>
  repo: RegistryRepositoryForm
  tech_stack: NonNullable<RegistryPayload['tech_stack']>
  stakeholders: NonNullable<RegistryPayload['stakeholders']>
  docs: NonNullable<RegistryPayload['docs']>
}

const $q = useQuasar()
const library = useLibraryStore()
const auth = useAuthStore()
const systems = ref<RegistryRecord[]>([])
const selected = ref<RegistryRecord | null>(null)
// The view endpoint includes relation labels and row metadata in addition to the editable payload.
// Keep a snapshot of that response for the read-only Details tab.
type RegistryScopedRepo = {
  repo_scope: string
  repo_git?: string | null
  staging_url?: string | null
  production_url?: string | null
  development_solution_type?: number | null
}
type RegistryApiWithRepos = RegistryRecord & { repos?: RegistryScopedRepo[] }

type DetailsApiRecord = {
  id?: number
  business_owner_department?: { id?: number; alias?: string; name?: string } | null
  status_name?: string | null
  desc?: { managing_type_name?: string | null; managing_office_department?: { id?: number; alias?: string; name?: string } | null; id?: number; registry_id?: number } | null
  repo?: { development_solution_type_name?: string | null; id?: number; registry_id?: number; created_at?: string; updated_at?: string } | null
  repos?: RegistryScopedRepo[]
  tech_stack?: { id?: number; registry_id?: number; created_at?: string; updated_at?: string } | null
  stakeholders?: Array<{ id?: number; registry_id?: number; user_id: number; stakeholder_type: number; stakeholder_type_name?: string; created_at?: string; updated_at?: string }>
  docs?: Array<{ id?: number; registry_id?: number; docs_type: number; docs_type_name?: string; file_path: string; created_at?: string; updated_at?: string }>
  created_at?: string
  updated_at?: string
}
type OverviewField = { label: string; value: string; wide?: boolean; status?: boolean; prominent?: boolean }
const detailsApiRecord = ref<DetailsApiRecord | null>(null)
// The API includes relation metadata, while editable form rows only contain payload fields.
// Use a common display type so both sources are safe in the Details template.
type DetailStakeholder = NonNullable<DetailsApiRecord['stakeholders']>[number]
type DetailDocument = NonNullable<DetailsApiRecord['docs']>[number]
function dash(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'string') return value.trim() || '—'
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') return String(value)
  return '—'
}
const detailStakeholders = computed<DetailStakeholder[]>(() =>
  detailsApiRecord.value?.stakeholders?.length
    ? detailsApiRecord.value.stakeholders
    : form.value.stakeholders.map(person => ({ ...person })),
)
const detailDocuments = computed<DetailDocument[]>(() =>
  detailsApiRecord.value?.docs?.length
    ? detailsApiRecord.value.docs
    : form.value.docs.map(doc => ({ ...doc })),
)
function detailUserName(id: number): string {
  if (Number(auth.user?.id) === Number(id)) return loggedInUserName.value
  return departmentUsers.value.find(user => Number(user.id) === Number(id))?.name ?? `User #${id}`
}
function documentPathSummary(path?: string | null): string {
  if (!path) return 'Not uploaded'
  if (path.startsWith(PENDING_DOC_PREFIX)) return 'Pending document — not uploaded'
  if (path.startsWith(PENDING_UPLOAD_PREFIX)) return 'File selected locally — upload not completed'
  if (path.startsWith(PENDING_DRAFT_PREFIX)) return 'Draft placeholder — content not stored'
  return path
}
const registryOverviewSections = computed<{ title: string; icon: string; fields: OverviewField[] }[]>(() => {
  const snapshot = detailsApiRecord.value
  const description = form.value.desc
  const tech = form.value.tech_stack
  const repo = form.value.repo
  const dept = snapshot?.business_owner_department
  const office = snapshot?.desc?.managing_office_department
  return [
    { title: 'System Profile', icon: 'dns', fields: [
      { label: 'System Name', value: `${dash(form.value.system_name)}${form.value.alias?.trim() ? ` (${form.value.alias.trim()})` : ''}`, prominent: true, wide: true },
      { label: 'Registry Status', value: snapshot?.status_name || (form.value.status == null ? '—' : statusLabel(form.value.status)), status: true },
      { label: 'Business Owner', value: dept ? `${dept.name || dept.alias || 'Department'}${dept.alias && dept.name ? ` (${dept.alias})` : ''}` : (form.value.business_owner == null ? '—' : departmentLabel(form.value.business_owner)) },

      { label: 'Description', value: form.value.description?.trim() || 'No description provided.', wide: true },
    ] },
    { title: 'Management', icon: 'business', fields: [
      { label: 'Managing Type', value: snapshot?.desc?.managing_type_name || (description.managing_type == null ? '—' : library.labelFor('managingTypes', description.managing_type)) },

      { label: 'Managing Office', value: office ? `${office.name || office.alias || 'Department'}${office.alias && office.name ? ` (${office.alias})` : ''}` : (description.managing_office == null ? '—' : departmentLabel(description.managing_office)) },

      { label: 'Third-Party Company', value: dash(description.third_party_company) },
      { label: 'Estimated Project Duration', value: description.estimation_project_duration == null ? '—' : `${description.estimation_project_duration} days` },
      { label: 'Project Roll-On', value: dash(description.project_roll_on) },
      { label: 'Project Sign-Off', value: dash(description.project_sign_off) },
    ] },
    { title: 'Technology Used', icon: 'memory', fields: [
      { label: 'Frontend Stack', value: stackNames(tech.frontend_stack) },
      { label: 'Backend Stack', value: stackNames(tech.backend_stack) },
      { label: 'Database', value: dash(tech.database) },
      { label: 'Server Type', value: dash(tech.server_type) },
      { label: 'Server Name', value: dash(tech.server_name) },
    ] },
    { title: 'Repository & Deployment', icon: 'account_tree', fields: [
      { label: 'Development Solution Type', value: snapshot?.repo?.development_solution_type_name || (repo.development_solution_type == null ? '—' : library.labelFor('developmentSolutionTypes', repo.development_solution_type)) },
      ...(isFullstackSolution.value ? [
        { label: 'Frontend Git Repository', value: dash(repo.frontend_repo_git), wide: true },
        { label: 'Frontend Staging URL', value: dash(repo.frontend_staging_url) },
        { label: 'Frontend Production URL', value: dash(repo.frontend_production_url) },
        { label: 'Backend Git Repository', value: dash(repo.backend_repo_git), wide: true },
        { label: 'Backend Staging URL', value: dash(repo.backend_staging_url) },
        { label: 'Backend Production URL', value: dash(repo.backend_production_url) },
      ] : [
        { label: 'Git Repository', value: dash(repo.repo_git), wide: true },
        { label: 'Staging URL', value: dash(repo.staging_url) },
        { label: 'Production URL', value: dash(repo.production_url) },
      ]),
    ] },
  ]
})

const search = ref('')
const statusFilter = ref<number | null>(null)
const loading = ref(false)
const loadError = ref('')
const saving = ref(false)
const formOpen = ref(false)
const profileOpen = ref(false)
// Frontend-only Scrum Planning preview. Task hierarchy follows ONE ICTMS traceability.
type ScrumSource = 'BRD' | 'SRS' | 'SDD' | 'User Stories'
type ScrumCategory = 'Frontend' | 'Backend' | 'DB' | 'UI/UX'
type ScrumReview = 'pending' | 'approved' | 'revision'
type ScrumDemoTask = {
  id: string; source: ScrumSource; category: ScrumCategory
  userStory: string; acceptanceCriteria: string; module: string
  title: string; description: string; dependencies: string[]
  points: number; estimatedHours: number; priority: 'High' | 'Medium' | 'Low'
  review: ScrumReview; sprintId: number | null
}
type ScrumDemoSprint = { id: number; name: string; startDate: string; endDate: string }
// Illustrative tasks only: replace with API output based on the actual project documents.
// Proposed implementation examples derived from Phase 1 LGBTQIA+ Public User user stories.
// These are not actual AI output and are not extracted from BRD/SRS/SDD.
const demoScrumTasks: ScrumDemoTask[] = [
  { id: "DB-01", source: "User Stories", category: "DB", userStory: "US-01: As a Public User, I want to see a dynamic \"Latest Highlights\" feed on the landing page, so that I can immediately see the organization's active impact.", acceptanceCriteria: "The feed must be automated; when a new Activity or News item is published in the backend, it must automatically push to the top of the Home Page.", module: "Latest Highlights", title: "Design highlight content schema", description: "Create content metadata and publication-status/date fields needed to order highlights.", dependencies: [], points: 3, estimatedHours: 0, priority: "High", review: "pending", sprintId: null },
  { id: "BE-01", source: "User Stories", category: "Backend", userStory: "US-01: As a Public User, I want to see a dynamic \"Latest Highlights\" feed on the landing page, so that I can immediately see the organization's active impact.", acceptanceCriteria: "The feed must be automated; when a new Activity or News item is published in the backend, it must automatically push to the top of the Home Page.", module: "Latest Highlights", title: "Build latest highlights API", description: "Return newly published activities and news ordered by publication date, latest first.", dependencies: ["DB-01"], points: 5, estimatedHours: 0, priority: "High", review: "pending", sprintId: null },
  { id: "FE-01", source: "User Stories", category: "Frontend", userStory: "US-01: As a Public User, I want to see a dynamic \"Latest Highlights\" feed on the landing page, so that I can immediately see the organization's active impact.", acceptanceCriteria: "The feed must be automated; when a new Activity or News item is published in the backend, it must automatically push to the top of the Home Page.", module: "Latest Highlights", title: "Connect home feed to published content", description: "Request published highlights and refresh the card list on page load.", dependencies: ["BE-01"], points: 3, estimatedHours: 0, priority: "High", review: "pending", sprintId: null },
  { id: "UX-01", source: "User Stories", category: "UI/UX", userStory: "US-01: As a Public User, I want to see a dynamic \"Latest Highlights\" feed on the landing page, so that I can immediately see the organization's active impact.", acceptanceCriteria: "Each post card must include a Category Tag (e.g., \"Event,\" \"Success Story\"), a Title, Description, Category, Date Published and a \"Share to Social Media\" option.", module: "Highlights Cards", title: "Design responsive highlight cards", description: "Design cards displaying category, title, description, publication date, and share action.", dependencies: [], points: 3, estimatedHours: 0, priority: "Medium", review: "pending", sprintId: null },
  { id: "FE-02", source: "User Stories", category: "Frontend", userStory: "US-01: As a Public User, I want to see a dynamic \"Latest Highlights\" feed on the landing page, so that I can immediately see the organization's active impact.", acceptanceCriteria: "Each post card must include a Category Tag (e.g., \"Event,\" \"Success Story\"), a Title, Description, Category, Date Published and a \"Share to Social Media\" option.", module: "Highlights Cards", title: "Implement highlight cards and share controls", description: "Build reusable card components including the required metadata and social sharing affordance.", dependencies: ["UX-01", "FE-01"], points: 5, estimatedHours: 0, priority: "High", review: "pending", sprintId: null },
  { id: "FE-03", source: "User Stories", category: "Frontend", userStory: "US-01: As a Public User, I want to see a dynamic \"Latest Highlights\" feed on the landing page, so that I can immediately see the organization's active impact.", acceptanceCriteria: "If a post contains a video, a \"Play\" icon must overlay the thumbnail.", module: "Highlights Media", title: "Render video play overlay", description: "Detect video highlights and render an accessible play control on the thumbnail.", dependencies: ["FE-02"], points: 2, estimatedHours: 0, priority: "High", review: "pending", sprintId: null },
  { id: "FE-04", source: "User Stories", category: "Frontend", userStory: "US-02: As a Public User, I want to share LGBTQ-related highlights from the Home Page with others.", acceptanceCriteria: "Upon selection, the system automatically redirects and sends the content to the chosen platform", module: "Social Sharing", title: "Implement social-share redirect", description: "Open a supported sharing URL with the selected published highlight link.", dependencies: [], points: 3, estimatedHours: 0, priority: "High", review: "pending", sprintId: null },
  { id: "UX-02", source: "User Stories", category: "UI/UX", userStory: "US-02: As a Public User, I want to share LGBTQ-related highlights from the Home Page with others.", acceptanceCriteria: "The system presents the option for Facebook.", module: "Social Sharing", title: "Design Facebook sharing option", description: "Define the share control behavior and accessible label for Facebook sharing.", dependencies: [], points: 2, estimatedHours: 0, priority: "Medium", review: "pending", sprintId: null },
  { id: "FE-05", source: "User Stories", category: "Frontend", userStory: "US-02: As a Public User, I want to share LGBTQ-related highlights from the Home Page with others.", acceptanceCriteria: "The system presents the option for Facebook.", module: "Social Sharing", title: "Add Facebook sharing option", description: "Expose the Facebook choice and connect it to the sharing redirect.", dependencies: ["UX-02", "FE-04"], points: 2, estimatedHours: 0, priority: "High", review: "pending", sprintId: null },
  { id: "FE-06", source: "User Stories", category: "Frontend", userStory: "US-03: As a Public User, I want to read the organizational background so that I can understand its history, core values, vision and mission, and leadership.", acceptanceCriteria: "The text must support rich formatting (e.g., Bold, Italics, and Bullet points) to highlight key milestones.", module: "About Us", title: "Render formatted About Us content", description: "Support headings, bold, italic, and bullet lists in content display.", dependencies: [], points: 3, estimatedHours: 0, priority: "Medium", review: "pending", sprintId: null },
  { id: "UX-03", source: "User Stories", category: "UI/UX", userStory: "US-03: As a Public User, I want to read the organizational background so that I can understand its history, core values, vision and mission, and leadership.", acceptanceCriteria: "The Mission, Vision, Core Values, Organization History and Leadership Profile must be visually distinct (e.g., placed in a styled box or using specific headings).", module: "About Us", title: "Design About Us information layout", description: "Create distinct responsive sections for mission, vision, values, history, and leadership.", dependencies: [], points: 3, estimatedHours: 0, priority: "Medium", review: "pending", sprintId: null },
  { id: "FE-07", source: "User Stories", category: "Frontend", userStory: "US-03: As a Public User, I want to read the organizational background so that I can understand its history, core values, vision and mission, and leadership.", acceptanceCriteria: "The Mission, Vision, Core Values, Organization History and Leadership Profile must be visually distinct (e.g., placed in a styled box or using specific headings).", module: "About Us", title: "Implement About Us sections", description: "Build and style the five content sections with clear hierarchy.", dependencies: ["UX-03"], points: 3, estimatedHours: 0, priority: "High", review: "pending", sprintId: null },
  { id: "FE-08", source: "User Stories", category: "Frontend", userStory: "US-03: As a Public User, I want to read the organizational background so that I can understand its history, core values, vision and mission, and leadership.", acceptanceCriteria: "If a \"History\" image or brand photo is included, it must be responsive and centered.", module: "About Us Media", title: "Implement responsive history image", description: "Center optional images and provide responsive sizing and alternate text.", dependencies: ["FE-07"], points: 2, estimatedHours: 0, priority: "Medium", review: "pending", sprintId: null },
]
const scrumAcknowledgementOpen = ref(false)
const scrumExecutionAcknowledged = ref(false)
const scrumAcknowledgementDocuments = [
  { code: 'BRD', name: 'Business Requirements Document', icon: 'assignment' },
  { code: 'SRS', name: 'Software Requirements Specification', icon: 'rule' },
  { code: 'SDD', name: 'System Design Document', icon: 'architecture' },
  { code: 'User Stories', name: 'User Stories', icon: 'format_list_bulleted' },
] as const
function requestScrumExecution(): void {
  scrumExecutionAcknowledged.value = false
  scrumAcknowledgementOpen.value = true
}
function cancelScrumExecution(): void {
  scrumAcknowledgementOpen.value = false
  scrumExecutionAcknowledged.value = false
}
function confirmScrumExecution(): void {
  if (!scrumExecutionAcknowledged.value) return
  scrumAcknowledgementOpen.value = false
  openScrumTaskReview()
}
const scrumPlanningOpen = ref(false)
const scrumTasks = ref<ScrumDemoTask[]>([])
const scrumTaskReviewOpen = ref(false)
const scrumEditTaskOpen = ref(false)
const scrumTaskDraft = ref<ScrumDemoTask | null>(null)
const scrumCreatingTask = ref(false)
const scrumReviewTab = ref<'stories' | 'modules'>('stories')
// Draft requirement catalogs are separate from tasks; empty records remain visible.
const scrumStoryCatalog = ref<string[]>([])
const scrumCriteriaCatalog = ref<Record<string, string[]>>({})
const scrumModuleCatalog = ref<string[]>([])
type ScrumModuleInfo = { code: string; description: string; status: 'Draft' | 'Under Review' | 'Approved'; story: string | null; criterion: string | null }
const scrumModuleInfo = ref<Record<string, ScrumModuleInfo>>({})
// Separate creation dialogs match the User Story and Module forms in the requirements review.
const scrumStoryCreateOpen = ref(false)
const scrumStoryCreateError = ref('')
const scrumNewStoryTitle = ref('')
const scrumNewStoryRole = ref('')
const scrumNewStoryGoal = ref('')
const scrumNewStoryBenefit = ref('')
const scrumNewStoryCriteria = ref<string[]>([''])
const scrumNewStoryPreview = computed(() => `As a ${scrumNewStoryRole.value.trim() || '[user role]'}, I want to ${scrumNewStoryGoal.value.trim() || '[goal]'} so that ${scrumNewStoryBenefit.value.trim() || '[benefit]'}.`)
function resetScrumStoryCreator(): void {
  scrumStoryCreateError.value = ''
  scrumNewStoryTitle.value = ''
  scrumNewStoryRole.value = ''
  scrumNewStoryGoal.value = ''
  scrumNewStoryBenefit.value = ''
  scrumNewStoryCriteria.value = ['']
}
function openScrumStoryCreator(): void {
  resetScrumStoryCreator()
  scrumStoryCreateOpen.value = true
}
function saveScrumStoryCreator(): void {
  const title = scrumNewStoryTitle.value.trim()
  const role = scrumNewStoryRole.value.trim()
  const goal = scrumNewStoryGoal.value.trim().replace(/[.\s]+$/, '')
  const benefit = scrumNewStoryBenefit.value.trim().replace(/[.\s]+$/, '')
  const criteria = scrumNewStoryCriteria.value.map(value => value.trim()).filter(Boolean)
  if (!title || !role || !goal || !benefit) { scrumStoryCreateError.value = 'Complete all required User Story fields.'; return }
  if (!criteria.length || criteria.length !== scrumNewStoryCriteria.value.length) { scrumStoryCreateError.value = 'Complete each acceptance criterion.'; return }
  if (new Set(criteria.map(c => c.toLowerCase())).size !== criteria.length) { scrumStoryCreateError.value = 'Acceptance criteria must be unique.'; return }
  const story = `As a ${role}, I want to ${goal} so that ${benefit}.`
  if (scrumStoryCatalog.value.includes(story)) { scrumStoryCreateError.value = 'This user story already exists.'; return }
  scrumStoryCatalog.value.push(story)
  scrumCriteriaCatalog.value[story] = criteria
  scrumReviewTab.value = 'stories'
  scrumStoryCreateOpen.value = false
}

const scrumModuleCreateOpen = ref(false)
const scrumUnifiedError = ref('')
const scrumUnifiedExistingStory = ref<string | null>(null)
const scrumUnifiedExistingCriterion = ref<string | null>(null)
const scrumUnifiedCriterionOptions = computed(() => scrumCriteriaCatalog.value[scrumUnifiedExistingStory.value ?? ''] ?? [])
const scrumUnifiedNewModule = ref('')
const scrumUnifiedModuleCode = ref('')
const scrumUnifiedModuleDescription = ref('')
const scrumUnifiedModuleStatus = ref<ScrumModuleInfo['status']>('Draft')
const scrumUnifiedAddTask = ref(false)
const scrumUnifiedTaskTitle = ref('')
const scrumUnifiedTaskCategory = ref<ScrumCategory>('Frontend')
const scrumUnifiedTaskPriority = ref<ScrumDemoTask['priority']>('Medium')
const scrumUnifiedTaskDescription = ref('')
const scrumUnifiedTaskPoints = ref(3)
const scrumUnifiedTaskEstimatedHours = ref(0)
const scrumUnifiedTaskDependencies = ref<string[]>([])
function resetScrumModuleCreator(): void {
  scrumUnifiedError.value = ''
  scrumUnifiedExistingStory.value = null
  scrumUnifiedExistingCriterion.value = null
  scrumUnifiedNewModule.value = ''
  scrumUnifiedModuleCode.value = ''
  scrumUnifiedModuleDescription.value = ''
  scrumUnifiedModuleStatus.value = 'Draft'
  scrumUnifiedAddTask.value = false
  scrumUnifiedTaskTitle.value = ''
  scrumUnifiedTaskCategory.value = 'Frontend'
  scrumUnifiedTaskPriority.value = 'Medium'
  scrumUnifiedTaskDescription.value = ''
  scrumUnifiedTaskPoints.value = 3
  scrumUnifiedTaskEstimatedHours.value = 0
  scrumUnifiedTaskDependencies.value = []
}
function openScrumModuleCreator(): void {
  resetScrumModuleCreator()
  scrumModuleCreateOpen.value = true
}
function saveScrumModuleCreator(): void {
  const moduleName = scrumUnifiedNewModule.value.trim()
  const code = scrumUnifiedModuleCode.value.trim()
  const description = scrumUnifiedModuleDescription.value.trim()
  const story = scrumUnifiedExistingStory.value
  const criterion = scrumUnifiedExistingCriterion.value
  if (!moduleName || !description) { scrumUnifiedError.value = 'Module name and description are required.'; return }
  if (scrumModuleCatalog.value.some(item => item.toLowerCase() === moduleName.toLowerCase())) { scrumUnifiedError.value = 'This module already exists.'; return }
  if (code && Object.values(scrumModuleInfo.value).some(info => info.code.toLowerCase() === code.toLowerCase())) { scrumUnifiedError.value = 'Module code already exists.'; return }
  if (story && !scrumStoryCatalog.value.includes(story)) { scrumUnifiedError.value = 'Choose a valid User Story.'; return }
  if (criterion && (!story || !(scrumCriteriaCatalog.value[story] ?? []).includes(criterion))) { scrumUnifiedError.value = 'Choose an acceptance criterion from the selected User Story.'; return }
  if (scrumUnifiedAddTask.value) {
    if (!story || !criterion) { scrumUnifiedError.value = 'Link a User Story and Acceptance Criterion before adding a task.'; return }
    if (!scrumUnifiedTaskTitle.value.trim() || !scrumUnifiedTaskDescription.value.trim() || !Number.isFinite(scrumUnifiedTaskPoints.value) || scrumUnifiedTaskPoints.value < 1 || scrumUnifiedTaskPoints.value > 100) { scrumUnifiedError.value = 'Complete task title, details, and valid story points.'; return }
    if (!Number.isFinite(scrumUnifiedTaskEstimatedHours.value) || scrumUnifiedTaskEstimatedHours.value < 0) { scrumUnifiedError.value = 'Estimated hours must be zero or greater.'; return }
    if (scrumUnifiedTaskDependencies.value.some(id => !scrumTasks.value.some(task => task.id === id))) { scrumUnifiedError.value = 'A task dependency no longer exists.'; return }
  }
  scrumModuleCatalog.value.push(moduleName)
  scrumModuleInfo.value[moduleName] = { code, description, status: scrumUnifiedModuleStatus.value, story, criterion }
  scrumExpandedModules.value[moduleName] = true
  if (scrumUnifiedAddTask.value && story && criterion) {
    const ids = new Set(scrumTasks.value.map(task => task.id))
    let number = 1
    while (ids.has(`TASK-${String(number).padStart(3, '0')}`)) number++
    scrumTasks.value.push({
      id: `TASK-${String(number).padStart(3, '0')}`, source: 'User Stories',
      category: scrumUnifiedTaskCategory.value, userStory: story, acceptanceCriteria: criterion,
      module: moduleName, title: scrumUnifiedTaskTitle.value.trim(), description: scrumUnifiedTaskDescription.value.trim(),
      dependencies: [...scrumUnifiedTaskDependencies.value], points: scrumUnifiedTaskPoints.value, estimatedHours: scrumUnifiedTaskEstimatedHours.value,
      priority: scrumUnifiedTaskPriority.value, review: 'pending', sprintId: null,
    })
  }
  scrumReviewTab.value = 'modules'
  scrumModuleCreateOpen.value = false
}

type ScrumTaskComment = { id: number; author: string; html: string; createdAt: string; reactions: string[] }
type ScrumTaskAttachment = { id: number; file: File }
const scrumTaskComments = ref<Record<string, ScrumTaskComment[]>>({})
const scrumTaskAttachments = ref<Record<string, ScrumTaskAttachment[]>>({})
const scrumCommentEmojis = ['😀', '😃', '😂', '😊', '😍', '🤔', '😮', '😢', '🔥', '🎉', '👍', '👎', '❤️', '👏', '✅', '🚀', '💯', '👀']
const scrumCommentReactions = ['👍', '❤️', '🎉', '😂', '👀']
const scrumCommentDraft = ref('')
const scrumCommentEditor = ref<{ runCmd: (command: string, argument?: string) => void } | null>(null)
let scrumCollabId = 0
const formatScrumCommentDate = (value: string): string => new Date(value).toLocaleString()
const formatScrumFileSize = (size: number): string => size < 1024 ? `${size} B` : size < 1024 * 1024 ? `${(size / 1024).toFixed(1)} KB` : `${(size / (1024 * 1024)).toFixed(1)} MB`

// Render only known formatting elements. Reject scripts, event handlers, remote images and unsafe URLs.
function sanitizeScrumCommentHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const allowed = new Set(['P', 'DIV', 'BR', 'B', 'STRONG', 'EM', 'I', 'U', 'S', 'STRIKE', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'A', 'IMG'])
  const prohibited = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'SVG', 'MATH', 'FORM', 'INPUT', 'VIDEO', 'AUDIO'])
  const safe = document.createElement('div')
  function copyChildren(source: Node, target: Node): void {
    for (const node of Array.from(source.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE) { target.appendChild(document.createTextNode(node.textContent || '')); continue }
      if (node.nodeType !== Node.ELEMENT_NODE) continue
      const element = node as Element
      if (prohibited.has(element.tagName)) continue
      if (!allowed.has(element.tagName)) { copyChildren(element, target); continue }
      const next = document.createElement(element.tagName.toLowerCase())
      if (element.tagName === 'IMG') {
        const src = element.getAttribute('src') || ''
        if (!/^data:image\/(png|jpeg|gif|webp);base64,[a-zA-Z0-9+/=]+$/.test(src) || src.length > 3_000_000) continue
        next.setAttribute('src', src)
        next.setAttribute('alt', 'Pasted comment image')
      }
      if (element.tagName === 'A') {
        const href = element.getAttribute('href') || ''
        if (/^https?:\/\//i.test(href)) { next.setAttribute('href', href); next.setAttribute('target', '_blank'); next.setAttribute('rel', 'noopener noreferrer') }
      }
      copyChildren(element, next)
      target.appendChild(next)
    }
  }
  copyChildren(doc.body, safe)
  return safe.innerHTML
}
const scrumCommentHasContent = computed(() => {
  const safe = sanitizeScrumCommentHtml(scrumCommentDraft.value)
  const doc = new DOMParser().parseFromString(safe, 'text/html')
  return Boolean(doc.body.textContent?.trim() || doc.body.querySelector('img'))
})
function onScrumCommentPaste(event: ClipboardEvent): void {
  const file = Array.from(event.clipboardData?.items || []).find(item => item.type.startsWith('image/'))?.getAsFile()
  if (!file) return
  event.preventDefault()
  if (!['image/png', 'image/jpeg', 'image/gif', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
    $q.notify({ type: 'warning', message: 'Paste a PNG, JPG, GIF or WebP image smaller than 2 MB.' })
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    if (typeof reader.result !== 'string') return
    scrumCommentEditor.value?.runCmd('insertHTML', `<img src="${reader.result}" alt="Pasted comment image">`)
  }
  reader.readAsDataURL(file)
}
function insertScrumCommentEmoji(emoji: string): void {
  if (!scrumCommentEmojis.includes(emoji)) return
  // QEditor handles insertion at the editor selection when available.
  if (scrumCommentEditor.value) scrumCommentEditor.value.runCmd('insertHTML', emoji)
  else scrumCommentDraft.value += emoji
}
function toggleScrumCommentReaction(taskId: string, commentId: number, emoji: string): void {
  if (!scrumCommentReactions.includes(emoji)) return
  const comment = scrumTaskComments.value[taskId]?.find(item => item.id === commentId)
  if (!comment) return
  comment.reactions = comment.reactions.includes(emoji)
    ? comment.reactions.filter(item => item !== emoji)
    : [...comment.reactions, emoji]
}
function addScrumComment(taskId: string): void {
  const html = sanitizeScrumCommentHtml(scrumCommentDraft.value)
  if (!scrumCommentHasContent.value) return
  scrumTaskComments.value[taskId] ??= []
  scrumTaskComments.value[taskId].push({ id: ++scrumCollabId, author: 'Current reviewer', html, createdAt: new Date().toISOString(), reactions: [] })
  scrumCommentDraft.value = ''
}
function removeScrumComment(taskId: string, commentId: number): void {
  scrumTaskComments.value[taskId] = (scrumTaskComments.value[taskId] || []).filter(item => item.id !== commentId)
}
function onScrumFilesSelected(event: Event, taskId: string): void {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files || [])
  const rejected = files.filter(file => file.size > 10 * 1024 * 1024)
  if (rejected.length) $q.notify({ type: 'warning', message: `${rejected.length} file(s) exceed the 10 MB limit.` })
  scrumTaskAttachments.value[taskId] ??= []
  for (const file of files.filter(item => item.size <= 10 * 1024 * 1024)) {
    scrumTaskAttachments.value[taskId].push({ id: ++scrumCollabId, file })
  }
  input.value = ''
}
function removeScrumAttachment(taskId: string, attachmentId: number): void {
  scrumTaskAttachments.value[taskId] = (scrumTaskAttachments.value[taskId] || []).filter(item => item.id !== attachmentId)
}
function downloadScrumAttachment(file: File): void {
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
const scrumPreviewTab = ref<'details' | 'technical' | 'dependencies' | 'comments' | 'attachments' | 'activity'>('details')
function openScrumPreviewKanban(task: ScrumDemoTask): void {
  if (task.sprintId === null) return
  scrumKanbanSprintId.value = task.sprintId
  scrumViewOpen.value = false
  scrumKanbanOpen.value = true
}
const scrumViewOpen = ref(false)
const scrumPreviewOrigin = ref<'review' | 'kanban'>('review')
function openScrumKanbanTaskPreview(task: ScrumDemoTask): void {
  scrumPreviewOrigin.value = 'kanban'
  viewScrumGeneratedTask(task)
}
const scrumViewTaskId = ref<string | null>(null)
const scrumViewStory = ref('')
const scrumViewCriterion = ref('')
// Resolve by ID so details stay in sync if the task is edited while the dialog is open.
const scrumViewTask = computed(() => scrumTasks.value.find(task => task.id === scrumViewTaskId.value) ?? null)
const scrumViewPredecessorTasks = computed(() => scrumTasks.value.filter(task => scrumViewTask.value?.dependencies.includes(task.id)))
const scrumViewSuccessorTasks = computed(() => scrumTasks.value.filter(task => scrumViewTask.value !== null && task.dependencies.includes(scrumViewTaskId.value ?? '')))
function viewScrumGeneratedTask(task: ScrumDemoTask): void {
  scrumViewTaskId.value = task.id
  scrumCommentDraft.value = ''
  scrumPreviewTab.value = 'details'
  scrumViewOpen.value = true
}
function viewScrumCriterion(story: string, criterion: string): void {
  scrumViewTaskId.value = null
  scrumViewStory.value = story
  scrumViewCriterion.value = criterion
  scrumViewOpen.value = true
}
function removeScrumTasks(ids: string[]): void {
  const removed = new Set(ids)
  if (!removed.size) return
  // Dependent tasks remain in the backlog, but must be re-reviewed without invalid links.
  const visited = new Set<string>()
  for (const id of removed) invalidateScrumDependents(id, visited)
  scrumTasks.value = scrumTasks.value.filter(task => !removed.has(task.id))
  for (const task of scrumTasks.value) {
    if (task.dependencies.some(id => removed.has(id))) {
      task.dependencies = task.dependencies.filter(id => !removed.has(id))
      task.review = 'pending'
      task.sprintId = null
    }
  }
  if (scrumViewTaskId.value && removed.has(scrumViewTaskId.value)) scrumViewOpen.value = false
}
function confirmRemoveScrumTask(task: ScrumDemoTask): void {
  const dependents = scrumTasks.value.filter(item => item.dependencies.includes(task.id))
  $q.dialog({
    title: `Remove ${task.id}?`,
    message: `Remove "${task.title}"?${dependents.length ? ` ${dependents.length} dependent task(s) will return to Pending Review and lose this dependency.` : ''} This cannot be undone in this preview.`,
    cancel: true,
    persistent: true,
    ok: { label: 'Remove Task', color: 'negative', unelevated: true },
  }).onOk(() => removeScrumTasks([task.id]))
}
function confirmRemoveScrumCriterion(story: string, criterion: string): void {
  const tasks = scrumTasks.value.filter(task => task.userStory === story && task.acceptanceCriteria === criterion)
  $q.dialog({
    title: 'Remove acceptance criterion?',
    message: `Remove this criterion and its ${tasks.length} linked task(s)? Other tasks depending on them will return to Pending Review. This cannot be undone in this preview.`,
    cancel: true,
    persistent: true,
    ok: { label: 'Remove Criterion', color: 'negative', unelevated: true },
  }).onOk(() => {
    removeScrumTasks(tasks.map(task => task.id))
    scrumCriteriaCatalog.value[story] = (scrumCriteriaCatalog.value[story] ?? []).filter(item => item !== criterion)
  })
}

const scrumRequirementEditorOpen = ref(false)
const scrumRequirementKind = ref<'story' | 'criterion' | 'module'>('story')
const scrumRequirementOriginal = ref('')
const scrumRequirementParent = ref('')
const scrumRequirementDraft = ref('')
const scrumRequirementError = ref('')
// UI-only collapse state; task records and review decisions are not changed by hiding.
const scrumHiddenCriterionTasks = ref<string[]>([])
function scrumCriterionKey(story: string, criterion: string): string {
  return JSON.stringify([story, criterion])
}
function scrumCriterionTasksHidden(story: string, criterion: string): boolean {
  return scrumHiddenCriterionTasks.value.includes(scrumCriterionKey(story, criterion))
}
function toggleScrumCriterionTasks(story: string, criterion: string): void {
  const key = scrumCriterionKey(story, criterion)
  scrumHiddenCriterionTasks.value = scrumCriterionTasksHidden(story, criterion)
    ? scrumHiddenCriterionTasks.value.filter(item => item !== key)
    : [...scrumHiddenCriterionTasks.value, key]
}
const scrumReviewSearch = ref('')
const scrumReviewCategoryFilter = ref('All Categories')
const scrumReviewStatusFilter = ref('All Statuses')
const scrumEditTaskError = ref('')
const scrumReviewStatusOptions = ['All Statuses', 'Pending review', 'Approved', 'Needs revision']
const scrumExpandedModules = ref<Record<string, boolean>>({})
function clearScrumReviewFilters(): void {
  scrumReviewSearch.value = ''
  scrumReviewStatusFilter.value = 'All Statuses'
  scrumReviewCategoryFilter.value = 'All Categories'
}
function setAllScrumModulesExpanded(expanded: boolean): void {
  scrumExpandedModules.value = Object.fromEntries(scrumReviewModules.value.map(name => [name, expanded]))
}
watch([scrumReviewTab, scrumReviewCategoryFilter], () => {
  if (scrumReviewTab.value !== 'modules') return
  const first = scrumReviewModules.value[0]
  scrumExpandedModules.value = first ? { [first]: true } : {}
})
const approvedScrumTasks = computed(() => scrumTasks.value.filter(task => task.review === 'approved').length)
const pendingScrumTasks = computed(() => scrumTasks.value.filter(task => task.review === 'pending').length)
const revisionScrumTasks = computed(() => scrumTasks.value.filter(task => task.review === 'revision').length)
const scrumReviewComplete = computed(() => scrumTasks.value.length > 0 && scrumTasks.value.every(task => canPlanScrumTask(task)))
const scrumReviewVisibleTasks = computed(() => scrumTasks.value.filter(task => {
  const query = scrumReviewSearch.value.trim().toLowerCase()
  return (!query || [task.id, task.title, task.module, task.userStory, task.acceptanceCriteria].some(value => value.toLowerCase().includes(query)))
    && (scrumReviewCategoryFilter.value === 'All Categories' || task.category === scrumReviewCategoryFilter.value)
    && (scrumReviewStatusFilter.value === 'All Statuses' || scrumReviewLabel(task.review) === scrumReviewStatusFilter.value)
}))
const scrumReviewStories = computed(() => scrumReviewSearch.value.trim() || scrumReviewStatusFilter.value !== 'All Statuses' || scrumReviewCategoryFilter.value !== 'All Categories'
  ? scrumStoryCatalog.value.filter(story => scrumReviewVisibleTasks.value.some(task => task.userStory === story))
  : scrumStoryCatalog.value)
function scrumReviewCriteria(story: string): string[] {
  const entries = scrumCriteriaCatalog.value[story] ?? []
  return scrumReviewSearch.value.trim() || scrumReviewStatusFilter.value !== 'All Statuses' || scrumReviewCategoryFilter.value !== 'All Categories'
    ? entries.filter(criterion => scrumReviewVisibleTasks.value.some(task => task.userStory === story && task.acceptanceCriteria === criterion))
    : entries
}
function scrumReviewTasksFor(story: string, criterion: string): ScrumDemoTask[] {
  return scrumReviewVisibleTasks.value.filter(task => task.userStory === story && task.acceptanceCriteria === criterion)
}
const scrumReviewModules = computed(() => scrumReviewSearch.value.trim() || scrumReviewStatusFilter.value !== 'All Statuses' || scrumReviewCategoryFilter.value !== 'All Categories'
  ? scrumModuleCatalog.value.filter(module => scrumReviewVisibleTasks.value.some(task => task.module === module))
  : scrumModuleCatalog.value)
function scrumReviewModuleTasks(moduleName: string): ScrumDemoTask[] {
  return scrumReviewVisibleTasks.value.filter(task => task.module === moduleName)
}
function openScrumRequirementEditor(kind: 'story' | 'criterion' | 'module', value: string, parent = ''): void {
  scrumRequirementKind.value = kind
  scrumRequirementOriginal.value = value
  scrumRequirementParent.value = parent
  scrumRequirementDraft.value = value
  scrumRequirementError.value = ''
  scrumRequirementEditorOpen.value = true
}
function saveScrumRequirement(): void {
  const next = scrumRequirementDraft.value.trim()
  const previous = scrumRequirementOriginal.value
  const kind = scrumRequirementKind.value
  if (!next) {
    scrumRequirementError.value = 'This field is required.'
    return
  }
  if (next === previous) {
    scrumRequirementEditorOpen.value = false
    return
  }
  const collision = kind === 'story'
    ? scrumStoryCatalog.value.includes(next)
    : kind === 'module'
      ? scrumModuleCatalog.value.includes(next)
      : (scrumCriteriaCatalog.value[scrumRequirementParent.value] ?? []).includes(next)
  if (collision) {
    scrumRequirementError.value = 'This name already exists. Choose a different name.'
    return
  }
  const affected = scrumTasks.value.filter(task => kind === 'story'
    ? task.userStory === previous
    : kind === 'module'
      ? task.module === previous
      : task.userStory === scrumRequirementParent.value && task.acceptanceCriteria === previous)
  for (const task of affected) {
    if (kind === 'story') task.userStory = next
    else if (kind === 'module') task.module = next
    else task.acceptanceCriteria = next
    task.review = 'pending'
    task.sprintId = null
    invalidateScrumDependents(task.id)
  }
  if (kind === 'story') {
    scrumStoryCatalog.value = scrumStoryCatalog.value.map(item => item === previous ? next : item)
    scrumCriteriaCatalog.value[next] = scrumCriteriaCatalog.value[previous] ?? []
    delete scrumCriteriaCatalog.value[previous]
  } else if (kind === 'module') {
    scrumModuleCatalog.value = scrumModuleCatalog.value.map(item => item === previous ? next : item)
    if (scrumModuleInfo.value[previous]) { scrumModuleInfo.value[next] = scrumModuleInfo.value[previous]; delete scrumModuleInfo.value[previous] }
    scrumExpandedModules.value[next] = scrumExpandedModules.value[previous] ?? true
    delete scrumExpandedModules.value[previous]
  } else {
    scrumCriteriaCatalog.value[scrumRequirementParent.value] = (scrumCriteriaCatalog.value[scrumRequirementParent.value] ?? [])
      .map(item => item === previous ? next : item)
  }
  scrumRequirementEditorOpen.value = false
}
function openScrumTaskReview(): void {
  scrumCreatingTask.value = false
  scrumTasks.value = demoScrumTasks.map(task => ({ ...task, dependencies: [...task.dependencies] }))
  scrumKanbanStatuses.value = {}
  scrumStoryCatalog.value = [...new Set(scrumTasks.value.map(task => task.userStory))]
  scrumCriteriaCatalog.value = Object.fromEntries(scrumStoryCatalog.value.map(story => [story,
    [...new Set(scrumTasks.value.filter(task => task.userStory === story).map(task => task.acceptanceCriteria))]]))
  scrumModuleCatalog.value = [...new Set(scrumTasks.value.map(task => task.module))]
  scrumModuleInfo.value = {}
  scrumSprints.value = [{ id: 1, name: 'Sprint 1', startDate: '', endDate: '' }, { id: 2, name: 'Sprint 2', startDate: '', endDate: '' }]
  scrumReviewTab.value = 'stories'
  scrumExpandedModules.value = {}
  scrumHiddenCriterionTasks.value = []
  scrumReviewSearch.value = ''
  scrumReviewCategoryFilter.value = 'All Categories'
  scrumReviewStatusFilter.value = 'All Statuses'
  scrumTaskReviewOpen.value = true
}
function setScrumReview(task: ScrumDemoTask, status: ScrumReview): void {
  task.review = status
  if (status !== 'approved') {
    task.sprintId = null
    // Any dependent task must be reviewed again after a prerequisite changes.
    invalidateScrumDependents(task.id)
  }
}
function invalidateScrumDependents(taskId: string, visited = new Set<string>()): void {
  if (visited.has(taskId)) return
  visited.add(taskId)
  for (const dependent of scrumTasks.value.filter(task => task.dependencies.includes(taskId))) {
    dependent.review = 'pending'
    dependent.sprintId = null
    invalidateScrumDependents(dependent.id, visited)
  }
}
function editScrumGeneratedTask(task: ScrumDemoTask): void {
  scrumCreatingTask.value = false
  scrumTaskDraft.value = { ...task, dependencies: [...task.dependencies] }
  scrumEditTaskError.value = ''
  scrumEditTaskOpen.value = true
}
const scrumDraftCriteriaOptions = computed(() => scrumCriteriaCatalog.value[scrumTaskDraft.value?.userStory ?? ''] ?? [])
const scrumDependencyOptions = computed(() => scrumTasks.value
  .filter(task => task.id !== scrumTaskDraft.value?.id)
  .map(task => ({ label: `${task.id} · ${task.title}`, value: task.id })))
function onScrumDraftStoryChanged(): void {
  if (scrumTaskDraft.value && !scrumDraftCriteriaOptions.value.includes(scrumTaskDraft.value.acceptanceCriteria)) {
    scrumTaskDraft.value.acceptanceCriteria = scrumDraftCriteriaOptions.value[0] ?? ''
  }
}
function scrumHasDependencyCycle(taskId: string, newDeps: string[]): boolean {
  const visited = new Set<string>()
  const walk = (id: string): boolean => {
    if (id === taskId) return true
    if (visited.has(id)) return false
    visited.add(id)
    const deps = scrumTasks.value.find(task => task.id === id)?.dependencies ?? []
    return deps.some(walk)
  }
  return newDeps.some(walk)
}
function saveScrumGeneratedTask(): void {
  const draft = scrumTaskDraft.value
  if (!draft) return
  const original = scrumTasks.value.find(task => task.id === draft.id)
  if (!scrumCreatingTask.value && !original) return
  if (!draft.title.trim() || !draft.description.trim() || !draft.module.trim() || !draft.userStory || !draft.acceptanceCriteria || !Number.isFinite(Number(draft.points)) || Number(draft.points) < 1 || Number(draft.points) > 100 || !Number.isFinite(Number(draft.estimatedHours)) || Number(draft.estimatedHours) < 0) {
    scrumEditTaskError.value = 'Complete required fields, enter 1–100 story points and valid estimated hours (0 or more).'
    return
  }
  if (draft.dependencies.some(id => !scrumTasks.value.some(task => task.id === id)) || scrumHasDependencyCycle(draft.id, draft.dependencies)) {
    scrumEditTaskError.value = 'Dependencies must exist and cannot create a circular chain.'
    return
  }
  if (!scrumModuleCatalog.value.includes(draft.module.trim())) scrumModuleCatalog.value.push(draft.module.trim())
  if (scrumCreatingTask.value) {
    if (original) {
      scrumEditTaskError.value = 'This task code already exists. Close and try adding the task again.'
      return
    }
    scrumTasks.value.push({ ...draft, points: Number(draft.points), estimatedHours: Number(draft.estimatedHours), dependencies: [...draft.dependencies], review: 'pending', sprintId: null })
  } else if (original) {
    Object.assign(original, { ...draft, points: Number(draft.points), estimatedHours: Number(draft.estimatedHours), dependencies: [...draft.dependencies], review: 'pending', sprintId: null })
    invalidateScrumDependents(draft.id)
  }
  scrumEditTaskOpen.value = false
  scrumTaskDraft.value = null
  scrumCreatingTask.value = false
}
function proceedToScrumPlanning(): void {
  if (!scrumReviewComplete.value) return
  void openScrumTeamAssignment()
}
function returnToReviewFromInvitation(): void {
  scrumTeamAssignmentOpen.value = false
  scrumTaskReviewOpen.value = true
}
function continueToScrumPlanning(): void {
  scrumTeamAssignmentOpen.value = false
  openScrumPlanning()
}
function returnToScrumTaskReview(): void {
  scrumPlanningOpen.value = false
  scrumTaskReviewOpen.value = true
}
// Step 2 is a local invitation preview: external pages must be confirmed manually.
const scrumTeamAssignmentOpen = ref(false)
const scrumMeetingSprintId = ref(1)
const scrumMeetingTitle = ref('Sprint Task Assignment Meeting')
const scrumMeetingDate = ref('')
const scrumMeetingTime = ref('10:00')
const scrumMeetingDuration = ref(60)
const scrumMeetingLink = ref('')
const scrumAttendees = ref<string[]>([])
const scrumMeetingSprintOptions = computed(() => scrumSprints.value.map(sprint => ({ label: sprint.name, value: sprint.id })))
const scrumRegistryStakeholders = computed(() => {
  const seen = new Set<string>()
  return form.value.stakeholders.flatMap(person => {
    const id = Number(person.user_id)
    const role = library.labelFor('stakeholderTypes', person.stakeholder_type) || 'Stakeholder'
    const key = `${id}:${role}`
    if (seen.has(key)) return []
    seen.add(key)
    const directoryUser = departmentUsers.value.find(user => Number(user.id) === id)
    const email = (directoryUser?.email || (Number(auth.user?.id) === id ? auth.user?.email : '') || '').trim().toLowerCase()
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null
    return [{ id, name: directoryUser?.name || (Number(auth.user?.id) === id ? loggedInUserName.value : `User #${id}`),
      email: validEmail, role }]
  })
})
// Group meeting participants under their assigned stakeholder roles.
// A user may appear in multiple roles, but invitation emails remain unique.
const scrumStakeholdersByRole = computed(() => {
  const roles = new Map<string, typeof scrumRegistryStakeholders.value>()
  for (const person of scrumRegistryStakeholders.value) {
    const members = roles.get(person.role) ?? []
    members.push(person)
    roles.set(person.role, members)
  }
  return Array.from(roles, ([role, people]) => ({
    role,
    people: [...people].sort((a, b) => a.name.localeCompare(b.name)),
  })).sort((a, b) => a.role.localeCompare(b.role))
})
const scrumMeetingReady = computed(() => !!scrumMeetingTitle.value.trim() && !!scrumMeetingDate.value && !!scrumMeetingTime.value && Number(scrumMeetingDuration.value) >= 15 && scrumAttendees.value.length > 0 && /^https:\/\/meet\.google\.com\/[a-z0-9-]+(?:[/?#].*)?$/i.test(scrumMeetingLink.value))
async function openScrumTeamAssignment(): Promise<void> {
  if (!scrumReviewComplete.value) return
  scrumMeetingSprintId.value = activeSprintId.value
  if (!scrumMeetingDate.value) {
    const now = new Date()
    scrumMeetingDate.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  }
  scrumMeetingTitle.value = `${form.value.system_name || 'ONE ICTMS'} - Sprint Planning & Task Assignment`
  // Load the stakeholder directories even if the registry editor has already closed.
  const departments = [...stakeholderSourceDepartments.value]
  await Promise.all(departments.map(async departmentId => {
    try {
      const users = await libraryApi.departmentUsers(departmentId)
      departmentDirectory.value = { ...departmentDirectory.value, [departmentId]: users }
    } catch {
      // Missing emails are shown in the stakeholder list rather than guessed.
    }
  }))
  scrumAttendees.value = scrumRegistryStakeholders.value.flatMap(person => person.email ? [person.email] : []).filter((email, index, all) => all.indexOf(email) === index)
  scrumTaskReviewOpen.value = false
  scrumPlanningOpen.value = false
  scrumTeamAssignmentOpen.value = true
}
function removeScrumAttendee(email: string): void {
  scrumAttendees.value = scrumAttendees.value.filter(item => item !== email)
}
function restoreScrumAttendee(email: string): void {
  if (scrumRegistryStakeholders.value.some(person => person.email === email) && !scrumAttendees.value.includes(email)) {
    scrumAttendees.value.push(email)
  }
}
function launchScrumGoogleMeet(): void {
  window.open('https://meet.google.com/new', '_blank', 'noopener,noreferrer')
}
function launchScrumCalendarInvite(): void {
  if (!scrumMeetingReady.value) return
  const start = new Date(`${scrumMeetingDate.value}T${scrumMeetingTime.value}:00`)
  if (Number.isNaN(start.getTime())) return
  const end = new Date(start.getTime() + Number(scrumMeetingDuration.value) * 60_000)
  const stamp = (date: Date): string => `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}00`
  const params = new URLSearchParams({
    action: 'TEMPLATE', text: scrumMeetingTitle.value, dates: `${stamp(start)}/${stamp(end)}`,
    details: `Google Meet: ${scrumMeetingLink.value}\n\nAgenda: Review approved tasks; discuss sprint scope and estimates; agree on task ownership and dependencies; confirm next steps for ${scrumMeetingSprintOptions.value.find(sprint => sprint.value === scrumMeetingSprintId.value)?.label || 'the upcoming sprint'}.`,
    location: scrumMeetingLink.value, add: scrumAttendees.value.join(','),
  })
  window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank', 'noopener,noreferrer')
}
type ScrumKanbanStatus = 'todo' | 'in-progress' | 'in-review' | 'done'
const scrumKanbanColumns: { id: ScrumKanbanStatus; label: string }[] = [
  { id: 'todo', label: 'To Do' }, { id: 'in-progress', label: 'In Progress' },
  { id: 'in-review', label: 'In Review' }, { id: 'done', label: 'Done' },
]
const scrumKanbanOpen = ref(false)
const scrumKanbanSprintId = ref(1)
const scrumKanbanCategory = ref<string>('All Categories')
const scrumKanbanSearch = ref('')
const scrumKanbanHover = ref<ScrumKanbanStatus | null>(null)
const scrumKanbanDraggingId = ref<string | null>(null)
const scrumKanbanStatuses = ref<Record<string, ScrumKanbanStatus>>({})
const scrumKanbanSprintOptions = computed(() => scrumSprints.value.map(sprint => ({ label: sprint.name, value: sprint.id })))
const scrumKanbanSelectedSprint = computed(() => scrumSprints.value.find(sprint => sprint.id === scrumKanbanSprintId.value))
function formatScrumKanbanDate(value?: string): string {
  if (!value) return 'Not set'
  const parts = value.split('-').map(Number)
  if (parts.length !== 3 || parts.some(part => !Number.isFinite(part))) return value
  const [year, month, day] = parts
  if (year === undefined || month === undefined || day === undefined) return value
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return value
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
const scrumKanbanSprintTasks = computed(() => scrumTasks.value.filter(task => task.sprintId === scrumKanbanSprintId.value))
const scrumKanbanSprintPoints = computed(() => scrumKanbanSprintTasks.value.reduce((total, task) => total + task.points, 0))
const scrumKanbanCompletedCount = computed(() => scrumKanbanSprintTasks.value.filter(task => scrumKanbanStatusFor(task.id) === 'done').length)
const scrumKanbanFilteredTasks = computed(() => {
  const query = scrumKanbanSearch.value.trim().toLowerCase()
  return scrumKanbanSprintTasks.value.filter(task =>
    (scrumKanbanCategory.value === 'All Categories' || task.category === scrumKanbanCategory.value) &&
    (!query || [task.id, task.title, task.module, scrumAssigneeFor(task.id)?.name ?? ''].some(value => value.toLowerCase().includes(query)))
  )
})
function scrumKanbanStatusFor(taskId: string): ScrumKanbanStatus {
  return scrumKanbanStatuses.value[taskId] ?? 'todo'
}
// Dependency badges reflect execution status, not the earlier task-review approval.
function scrumDependencyKanbanState(taskId: string): { label: string; color: string; textColor: string } {
  const dependency = scrumTasks.value.find(task => task.id === taskId)
  if (!dependency) return { label: 'Missing', color: 'red-1', textColor: 'red-9' }
  if (dependency.sprintId === null) return { label: 'Not planned', color: 'grey-2', textColor: 'grey-8' }
  switch (scrumKanbanStatusFor(taskId)) {
    case 'in-progress': return { label: 'In Progress', color: 'blue-1', textColor: 'blue-9' }
    case 'in-review': return { label: 'In Review', color: 'orange-1', textColor: 'orange-9' }
    case 'done': return { label: 'Done', color: 'green-1', textColor: 'green-9' }
    default: return { label: 'To Do', color: 'grey-2', textColor: 'grey-9' }
  }
}
function scrumKanbanTasksInColumn(status: ScrumKanbanStatus): ScrumDemoTask[] {
  return scrumKanbanFilteredTasks.value.filter(task => scrumKanbanStatusFor(task.id) === status)
}
function setScrumKanbanStatus(taskId: string, status: ScrumKanbanStatus): void {
  if (!scrumKanbanColumns.some(column => column.id === status)) return
  if (!scrumKanbanSprintTasks.value.some(task => task.id === taskId)) return
  scrumKanbanStatuses.value = { ...scrumKanbanStatuses.value, [taskId]: status }
}
function onScrumKanbanDragStart(event: DragEvent, taskId: string): void {
  scrumKanbanDraggingId.value = taskId
  event.dataTransfer?.setData('text/plain', `kanban-task:${taskId}`)
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
}
function onScrumKanbanDrop(event: DragEvent, status: ScrumKanbanStatus): void {
  const payload = event.dataTransfer?.getData('text/plain') ?? ''
  const id = payload.startsWith('kanban-task:') ? payload.slice('kanban-task:'.length) : scrumKanbanDraggingId.value
  if (id) setScrumKanbanStatus(id, status)
  scrumKanbanHover.value = null
  scrumKanbanDraggingId.value = null
}
function openScrumKanban(): void {
  if (!scrumTasks.value.some(task => task.sprintId !== null)) return
  scrumKanbanSprintId.value = scrumTasks.value.some(task => task.sprintId === activeSprintId.value)
    ? activeSprintId.value : scrumTasks.value.find(task => task.sprintId !== null)?.sprintId ?? activeSprintId.value
  scrumKanbanCategory.value = 'All Categories'
  scrumKanbanSearch.value = ''
  scrumPlanningOpen.value = false
  scrumKanbanOpen.value = true
}
function returnToScrumPlanningFromKanban(): void {
  scrumKanbanOpen.value = false
  activeSprintId.value = scrumKanbanSprintId.value
  scrumPlanningOpen.value = true
}

const scrumSprints = ref<ScrumDemoSprint[]>([{ id: 1, name: 'Sprint 1', startDate: '', endDate: '' }, { id: 2, name: 'Sprint 2', startDate: '', endDate: '' }])
const activeSprintId = ref(1)
const scrumCategoryFilter = ref('All Categories')
const scrumCategoryFilters = ['All Categories', 'Frontend', 'Backend', 'DB', 'UI/UX'] as const
const scrumPlanningExpandedModules = ref<string[]>([])
const expandedScrumTaskId = ref<string | null>(null)
const scrumUserStories = computed(() => scrumStoryCatalog.value)
const scrumDraggingId = ref<string | null>(null)
const scrumDraggingModule = ref<string | null>(null)
const scrumDropOver = ref(false)
const reviewedScrumTasks = computed(() => scrumTasks.value.filter(task => task.review !== 'pending').length)
const scheduledScrumTasks = computed(() => scrumTasks.value.filter(task => task.sprintId !== null).length)
const unscheduledScrumTasks = computed(() => scrumTasks.value.filter(task => task.sprintId === null).length)
const visibleScrumSuggestions = computed(() => scrumTasks.value.filter(task =>
  task.sprintId === null && (scrumCategoryFilter.value === 'All Categories' || task.category === scrumCategoryFilter.value)
))
const scrumBacklogModuleGroups = computed(() => {
  const grouped = new Map<string, ScrumDemoTask[]>()
  for (const task of visibleScrumSuggestions.value) {
    const tasks = grouped.get(task.module) ?? []
    tasks.push(task)
    grouped.set(task.module, tasks)
  }
  return [...grouped].map(([module, tasks]) => ({ module, tasks }))
})
const activeScrumSprintModules = computed(() => {
  const grouped = new Map<string, ScrumDemoTask[]>()
  for (const task of scrumTasks.value.filter(task => task.sprintId === activeSprintId.value)) {
    const tasks = grouped.get(task.module) ?? []
    tasks.push(task)
    grouped.set(task.module, tasks)
  }
  return [...grouped].map(([module, tasks]) => ({ module, tasks }))
})
function toggleScrumModule(module: string): void {
  scrumPlanningExpandedModules.value = scrumPlanningExpandedModules.value.includes(module)
    ? scrumPlanningExpandedModules.value.filter(name => name !== module)
    : [...scrumPlanningExpandedModules.value, module]
}
// Sprint assignees come exclusively from the selected Managing Office directory.
// These assignments are local preview state until a sprint-assignment API is connected.
const scrumTaskAssignees = ref<Record<string, number>>({})
const scrumManagingOfficeUsers = ref<StakeholderUser[]>([])
const scrumManagingOfficeLoading = ref(false)
const scrumManagingOfficeError = ref('')
let scrumManagingOfficeRequestVersion = 0
const scrumManagingOfficeId = computed(() => {
  const id = Number(form.value.desc.managing_office)
  return Number.isInteger(id) && id > 0 ? id : null
})
const scrumAssigneeSearch = ref('')
const filteredScrumAssignees = computed(() => {
  const query = scrumAssigneeSearch.value.trim().toLowerCase()
  return scrumManagingOfficeUsers.value.filter(person =>
    !query || person.name.toLowerCase().includes(query) || (person.email || '').toLowerCase().includes(query))
})
function scrumAssigneeFor(taskId: string): StakeholderUser | undefined {
  return scrumManagingOfficeUsers.value.find(person => person.id === scrumTaskAssignees.value[taskId])
}
const activeScrumSprintTasks = computed(() => scrumTasks.value.filter(task => task.sprintId === activeSprintId.value))
async function loadScrumManagingOfficeUsers(): Promise<void> {
  const version = ++scrumManagingOfficeRequestVersion
  const officeId = scrumManagingOfficeId.value
  scrumManagingOfficeUsers.value = []
  scrumManagingOfficeError.value = ''
  if (officeId === null) {
    scrumManagingOfficeError.value = 'Select a Managing Office in the System Registry to assign sprint tasks.'
    return
  }
  scrumManagingOfficeLoading.value = true
  try {
    const users = await libraryApi.departmentUsers(officeId)
    if (version !== scrumManagingOfficeRequestVersion) return
    scrumManagingOfficeUsers.value = users
      .filter(user => Number.isInteger(Number(user.id)) && Number(user.id) > 0)
      .map(user => ({ id: Number(user.id), name: user.name?.trim() || `User #${user.id}`,
        email: user.email ?? null, departmentIds: [officeId] }))
      .sort((a, b) => a.name.localeCompare(b.name))
    const allowed = new Set(scrumManagingOfficeUsers.value.map(user => user.id))
    scrumTaskAssignees.value = Object.fromEntries(Object.entries(scrumTaskAssignees.value)
      .filter(([, id]) => allowed.has(id)))
    if (users.length === 0) scrumManagingOfficeError.value = 'No users found in the Managing Office.'
  } catch (error) {
    if (version !== scrumManagingOfficeRequestVersion) return
    scrumManagingOfficeError.value = `Unable to load Managing Office members: ${errorMessage(error)}`
  } finally {
    if (version === scrumManagingOfficeRequestVersion) scrumManagingOfficeLoading.value = false
  }
}
function setScrumTaskAssignee(taskId: string, userId: number | null): void {
  const task = scrumTasks.value.find(item => item.id === taskId)
  if (!task) return
  if (userId === null) {
    const remaining = { ...scrumTaskAssignees.value }
    delete remaining[taskId]
    scrumTaskAssignees.value = remaining
    return
  }
  if (task.sprintId === null || !scrumManagingOfficeUsers.value.some(user => user.id === userId)) return
  scrumTaskAssignees.value = { ...scrumTaskAssignees.value, [taskId]: userId }
}

const activeScrumSprint = computed(() => scrumSprints.value.find(sprint => sprint.id === activeSprintId.value))
const activeScrumSprintHours = computed(() => activeScrumSprintTasks.value.reduce((sum, task) => sum + task.estimatedHours, 0))
const activeScrumSprintName = computed(() => scrumSprints.value.find(sprint => sprint.id === activeSprintId.value)?.name ?? 'Sprint')
const activeScrumSprintPoints = computed(() => activeScrumSprintTasks.value.reduce((sum, task) => sum + task.points, 0))
function scrumReviewLabel(review: ScrumReview): string {
  if (review === 'approved') return 'Approved'
  if (review === 'revision') return 'Needs revision'
  return 'Pending review'
}
function canPlanScrumTask(task: ScrumDemoTask): boolean {
  return task.review === 'approved' && task.dependencies.every(dep => scrumTasks.value.find(candidate => candidate.id === dep)?.review === 'approved')
}
function scrumModuleTasks(module: string, sprintId: number | null): ScrumDemoTask[] {
  return scrumTasks.value.filter(task => task.module === module && task.sprintId === sprintId)
}
function canPlanScrumModule(module: string): boolean {
  const tasks = scrumModuleTasks(module, null)
  return tasks.length > 0 && tasks.every(canPlanScrumTask)
}
function moveScrumModule(module: string, sprintId: number | null): void {
  const tasks = scrumModuleTasks(module, sprintId === null ? activeSprintId.value : null)
  // Keep module assignment atomic: a module is never partially planned by a single drop.
  if (sprintId !== null && (tasks.length === 0 || !tasks.every(canPlanScrumTask))) return
  for (const task of tasks) {
    task.sprintId = sprintId
    if (sprintId === null) setScrumTaskAssignee(task.id, null)
  }
}
function countScrumSprintTasks(id: number): number { return scrumTasks.value.filter(task => task.sprintId === id).length }
function openScrumPlanning(): void {
  activeSprintId.value = 1
  scrumCategoryFilter.value = 'All Categories'
  scrumPlanningExpandedModules.value = [...new Set(scrumTasks.value.filter(task => task.sprintId === null).map(task => task.module))]
  clearScrumDrag()
  scrumPlanningOpen.value = true
  void loadScrumManagingOfficeUsers()
}
function addScrumSprint(): void {
  const nextId = Math.max(0, ...scrumSprints.value.map(sprint => sprint.id)) + 1
  scrumSprints.value.push({ id: nextId, name: `Sprint ${nextId}`, startDate: '', endDate: '' })
  activeSprintId.value = nextId
}
function moveScrumTask(id: string, sprintId: number | null): void {
  const task = scrumTasks.value.find(item => item.id === id)
  if (task && (sprintId === null || (task.review === 'approved' && task.dependencies.every(dep => scrumTasks.value.find(candidate => candidate.id === dep)?.review === 'approved')))) {
    task.sprintId = sprintId
    if (sprintId === null) setScrumTaskAssignee(task.id, null)
  }
}
function clearScrumDrag(): void {
  scrumDraggingId.value = null
  scrumDraggingModule.value = null
}
function onScrumModuleDragStart(event: DragEvent, module: string, source: 'backlog' | 'sprint'): void {
  if (source === 'backlog' && !canPlanScrumModule(module)) {
    event.preventDefault()
    return
  }
  scrumDraggingModule.value = module
  scrumDraggingId.value = null
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', `module:${encodeURIComponent(module)}`)
  }
}
function onScrumDragStart(event: DragEvent, id: string): void {
  scrumDraggingId.value = id
  scrumDraggingModule.value = null
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', `task:${id}`)
  }
}
function onScrumDropToSprint(event: DragEvent): void {
  scrumDropOver.value = false
  const payload = event.dataTransfer?.getData('text/plain') ?? ''
  if (payload.startsWith('module:')) {
    moveScrumModule(decodeURIComponent(payload.slice('module:'.length)), activeSprintId.value)
  } else if (payload.startsWith('task:')) {
    moveScrumTask(payload.slice('task:'.length), activeSprintId.value)
  } else if (scrumDraggingModule.value) {
    moveScrumModule(scrumDraggingModule.value, activeSprintId.value)
  } else if (scrumDraggingId.value) {
    moveScrumTask(scrumDraggingId.value, activeSprintId.value)
  }
  clearScrumDrag()
}
function onScrumDropToBacklog(event: DragEvent): void {
  event.preventDefault()
  const payload = event.dataTransfer?.getData('text/plain') ?? ''
  if (payload.startsWith('module:')) {
    moveScrumModule(decodeURIComponent(payload.slice('module:'.length)), null)
  } else if (payload.startsWith('task:')) {
    moveScrumTask(payload.slice('task:'.length), null)
  } else if (scrumDraggingModule.value) {
    moveScrumModule(scrumDraggingModule.value, null)
  } else if (scrumDraggingId.value) {
    moveScrumTask(scrumDraggingId.value, null)
  }
  clearScrumDrag()
}

const formStep = ref(1)
const stepLabels = ['System Profile', 'Management', 'Documents', 'Stakeholders', 'Technology Used', 'Repository']
const wizardStepLabels = computed(() => editingId.value === null ? stepLabels : ['Details', ...stepLabels.slice(1)])
const wizardStepIcons = ['dashboard_customize', 'corporate_fare', 'description', 'groups', 'memory', 'account_tree']

// The Registry API persists { docs_type, file_path } only. Pending markers below
// are NOT real file locations; they let Create/Update create registry_docs rows
// before actual upload/draft APIs exist. Assignee and draft content remain local.
const documentFiles = ref<Record<string, string>>({})
// Keep a renamed File object for a future multipart upload endpoint.
// File selection alone does NOT persist a document on the backend.
const documentFileObjects = ref<Record<string, File>>({})
const documentDraftNames = ref<Record<string, string>>({})
const documentDraftContents = ref<Record<string, string>>({})
const documentDraftDialog = ref(false)
const editingDraftIndex = ref<number | null>(null)
const editingDraftName = ref('')
const editingDraftContent = ref('')
const editingDraftEnabled = ref(false)
const documentAssignees = ref<Record<string, number>>({})
const documentPathDialog = ref(false)
const editingDocumentIndex = ref<number | null>(null)
const editingDocumentPath = ref('')
const documentPreviewUrls: string[] = []
const documentAssigneeDialog = ref(false)
const assigningDocument = ref<string | null>(null)
const selectedDocumentAssignee = ref<number | null>(null)
const documentAssigneeFilter = ref('')
// Match the existing Document Library IDs and ordering: BRD=1, SRS=2, SDD=3, User Stories=4.
const registryDocumentTypeIds = [1, 2, 3, 4]
function initialRegistryDocs(): RegistryForm['docs'] {
  return registryDocumentTypeIds.map(docs_type => ({ docs_type, file_path: '' }))
}
function registryDocsForEdit(existing: RegistryForm['docs']): RegistryForm['docs'] {
  const fixed = registryDocumentTypeIds.map(docs_type => ({
    docs_type,
    file_path: existing.find(item => Number(item.docs_type) === docs_type)?.file_path ?? '',
  }))
  // Keep legacy document types in the payload even though only four standard rows are displayed.
  const legacy = existing.filter(item => !registryDocumentTypeIds.includes(Number(item.docs_type)))
  return [...fixed, ...legacy]
}
function triggerDocumentFile(index: number): void {
  document.getElementById(`registry-file-${index}`)?.click()
}
function createDocumentDraftName(index: number): void {
  const doc = form.value.docs[index]
  const key = String(index)
  if (!doc || (managementMode.value !== 'joint' && !documentAssignees.value[key]) || (doc.file_path?.trim() && !isPendingDocumentPath(doc.file_path)) || documentFiles.value[key]) return
  const name = library.labelFor('documentTypes', Number(doc.docs_type)) || `Document ${index + 1}`
  documentDraftNames.value[key] = `${name} — Draft`
  documentDraftContents.value[key] = `# ${name}\n\n## Overview\n\n## Objectives\n\n## Requirements\n\n## Notes\n`
  $q.notify({ type: 'info', message: 'A local draft template was created. AI generation is not connected yet.' })
  openDocumentDraft(index, true)
}
function openDocumentDraft(index: number, editable: boolean): void {
  const key = String(index)
  if (!documentDraftNames.value[key]) return
  editingDraftIndex.value = index
  editingDraftName.value = documentDraftNames.value[key]
  editingDraftContent.value = documentDraftContents.value[key] ?? ''
  editingDraftEnabled.value = editable
  documentDraftDialog.value = true
}
function saveDocumentDraft(): void {
  if (editingDraftIndex.value === null) return
  documentDraftContents.value[String(editingDraftIndex.value)] = editingDraftContent.value
  documentDraftDialog.value = false
  $q.notify({ type: 'positive', message: 'Draft saved locally in this form.' })
}
// Document Library IDs: 1=BRD, 2=SRS, 3=SDD, 4=User Stories.
const documentAliases: Record<number, string> = { 1: 'BRD', 2: 'SRS', 3: 'SDD', 4: 'US' }
const PENDING_DOC_PREFIX = '__pending_document__/'
const PENDING_DRAFT_PREFIX = '__pending_draft__/'
const PENDING_UPLOAD_PREFIX = '__pending_upload__/'
function isPendingDocumentPath(path?: string | null): boolean {
  return Boolean(path && [PENDING_DOC_PREFIX, PENDING_DRAFT_PREFIX, PENDING_UPLOAD_PREFIX].some(prefix => path.startsWith(prefix)))
}
function documentDateStamp(): string {
  const now = new Date()
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
}
// Always provide the 4 standard document records to Registry Create/Update.
// A pending marker is a workflow placeholder, never proof of uploaded content.
function docsForRegistryPayload(): NonNullable<RegistryPayload['docs']> {
  return form.value.docs.filter(doc => Number(doc.docs_type) > 0).map((doc, index) => {
    const type = Number(doc.docs_type)
    const key = String(index)
    const existing = doc.file_path?.trim() ?? ''
    const alias = documentAliases[type] ?? `DOC${type}`
    const fileName = documentFiles.value[key]
    const isDraft = Boolean(documentDraftNames.value[key])
    let filePath = existing
    if (fileName) filePath = `${PENDING_UPLOAD_PREFIX}${fileName}`
    else if (isDraft) filePath = `${PENDING_DRAFT_PREFIX}${documentDateStamp()}_${alias}.md`
    else if (!filePath) filePath = `${PENDING_DOC_PREFIX}${alias}`
    return { docs_type: type, file_path: filePath }
  })
}
function datedDocumentFileName(file: File, docsType: number): string {
  const now = new Date()
  const dateStamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  const alias = documentAliases[docsType] ?? `DOC${docsType}`
  const extension = /\.[a-zA-Z0-9]+$/.exec(file.name)?.[0]?.toLowerCase() ?? ''
  return `${dateStamp}_${alias}${extension}`
}
function onDocumentFileSelected(key: string, event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const index = Number(key)
  const doc = form.value.docs[index]
  if (!doc) return

  const filename = datedDocumentFileName(file, Number(doc.docs_type))
  // Rename the local File object rather than changing only the displayed text.
  // It remains in memory until a file-upload API is implemented.
  const renamedFile = new File([file], filename, { type: file.type, lastModified: file.lastModified })
  documentFileObjects.value[key] = renamedFile
  documentFiles.value[key] = renamedFile.name
  delete documentDraftNames.value[key]
  delete documentDraftContents.value[key]
  input.value = '' // Re-selecting the same physical file should still trigger change.
  $q.notify({ type: 'info', message: `${filename} selected locally. The file has not been uploaded to the server.` })
}
function viewDocumentFile(index: number): void {
  const key = String(index)
  if (!documentFileObjects.value[key] && !form.value.docs[index]?.file_path?.trim() && documentDraftNames.value[key]) {
    openDocumentDraft(index, false)
    return
  }
  const localFile = documentFileObjects.value[key]
  if (localFile) {
    const url = URL.createObjectURL(localFile)
    documentPreviewUrls.push(url)
    window.open(url, '_blank', 'noopener,noreferrer')
    return
  }
  const path = form.value.docs[index]?.file_path?.trim()
  if (!path || isPendingDocumentPath(path)) {
    $q.notify({ type: 'info', message: 'This record is pending. No server file is available to preview.' })
    return
  }
  try {
    // Only open web-addressable paths. A server storage path may not be a public URL.
    const url = new URL(path, window.location.origin)
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Unsupported path')
    window.open(url.href, '_blank', 'noopener,noreferrer')
  } catch {
    $q.notify({ type: 'warning', message: 'This file path cannot be opened directly. Use a public or authenticated file-view URL.' })
  }
}
function editDocumentFile(index: number): void {
  const doc = form.value.docs[index]
  if (!doc) return
  if ((!doc.file_path?.trim() || isPendingDocumentPath(doc.file_path)) && !documentFileObjects.value[String(index)] && documentDraftNames.value[String(index)]) {
    openDocumentDraft(index, true)
    return
  }
  if (!doc.file_path?.trim() && documentFileObjects.value[String(index)]) {
    // Locally selected files have no saved server path to edit.
    triggerDocumentFile(index)
    return
  }
  editingDocumentIndex.value = index
  editingDocumentPath.value = doc.file_path ?? ''
  documentPathDialog.value = true
}
function saveDocumentPath(): void {
  const index = editingDocumentIndex.value
  if (index == null) return
  const doc = form.value.docs[index]
  if (!doc) return
  doc.file_path = editingDocumentPath.value.trim()
  // An edited stored path supersedes a previous locally selected file.
  delete documentFileObjects.value[String(index)]
  delete documentFiles.value[String(index)]
  documentPathDialog.value = false
  editingDocumentIndex.value = null
}
function removeDocumentAssignee(key: string): void {
  delete documentAssignees.value[key]
  if (assigningDocument.value === key) {
    assigningDocument.value = null
    selectedDocumentAssignee.value = null
  }
  $q.notify({ type: 'info', message: 'Document task assignment removed from this form.' })
}
const documentAssigneeOptions = computed<{ label: string; value: number }[]>(() => {
  // Document tasks can only be assigned to actual Managing Office department members.
  // Never fall back to Business Owner users or the signed-in account.
  if (!isInternallyManaged.value) return []
  const officeId = Number(form.value.desc.managing_office)
  if (!Number.isInteger(officeId) || officeId <= 0) return []
  return (departmentDirectory.value[officeId] ?? [])
    .filter(user => Number.isInteger(Number(user.id)) && Number(user.id) > 0)
    .map(user => ({ label: user.name?.trim() || `User #${user.id}`, value: Number(user.id) }))
    .sort((a, b) => a.label.localeCompare(b.label))
})
const filteredDocumentAssigneeOptions = computed(() => {
  const term = documentAssigneeFilter.value.toLowerCase().trim()
  return documentAssigneeOptions.value.filter(option => !term || option.label.toLowerCase().includes(term))
})
function filterDocumentAssignees(value: string, update: (callback: () => void) => void): void {
  update(() => { documentAssigneeFilter.value = value })
}
function documentAssigneeName(id?: number): string {
  return documentAssigneeOptions.value.find(option => option.value === id)?.label ?? (id ? `User #${id}` : 'Unassigned')
}
function openDocumentAssignee(key: string): void {
  assigningDocument.value = key
  const existing = documentAssignees.value[key]
  selectedDocumentAssignee.value = existing != null && documentAssigneeOptions.value.some(option => option.value === existing) ? existing : null
  documentAssigneeFilter.value = ''
  documentAssigneeDialog.value = true
}
function assignDocumentTask(): void {
  const key = assigningDocument.value
  const id = selectedDocumentAssignee.value
  if (!key || id === null || !documentAssigneeOptions.value.some(option => option.value === id)) {
    $q.notify({ type: 'warning', message: 'Please choose a user from the selected Managing Office.' })
    return
  }
  documentAssignees.value[key] = id
  documentAssigneeDialog.value = false
  $q.notify({ type: 'info', message: 'Task assigned in this form only. Backend task persistence is not yet available.' })
}
function resetDocumentWorkspace(): void {
  documentFileObjects.value = {}
  documentFiles.value = {}
  documentDraftNames.value = {}
  documentDraftContents.value = {}
  documentDraftDialog.value = false
  editingDraftIndex.value = null
  editingDraftContent.value = ''
  documentAssignees.value = {}
  documentPathDialog.value = false
  editingDocumentIndex.value = null
  editingDocumentPath.value = ''
  for (const url of documentPreviewUrls.splice(0)) URL.revokeObjectURL(url)
  documentAssigneeDialog.value = false
}

const addChoiceOpen = ref(false)
const existingSearchOpen = ref(false)
const existingQuery = ref('')
const existingOpeningId = ref<number | null>(null)
const existingOpening = computed(() => existingOpeningId.value !== null)
const existingMatches = computed(() => {
  const q = existingQuery.value.trim().toLowerCase()
  return systems.value.filter(item =>
    !q || [item.system_name, item.alias, item.description].some(value => String(value ?? '').toLowerCase().includes(q)),
  ).slice(0, 100)
})
const viewOpen = ref(false)
const editingId = ref<number | null>(null)
const pagination = ref({ page: 1, rowsPerPage: 10 })
// Initialize before watchers and computed expressions that access form.value.
const form = ref<RegistryForm>(emptyForm())
// Observe Managing Office changes only after the form ref is initialized.
watch(() => [form.value.desc.managing_type, form.value.desc.managing_office], () => {
  selectedDocumentAssignee.value = null
  documentAssigneeFilter.value = ''
})
type StakeholderUser = { id: number; name: string; email: string | null; departmentIds: number[] }
type StakeholderSectionKey = 'owner' | 'office'
const departmentUsersLoading = ref(false)
const departmentDirectory = ref<Record<number, DepartmentUser[]>>({})
const departmentErrors = ref<Record<number, string>>({})
const departmentLoadedIds = ref<number[]>([])
let departmentRequestVersion = 0
// Resolve management mode by Library name/alias rather than assuming fixed IDs.
type ManagementMode = 'internal' | 'third-party' | 'joint' | 'other' | 'unselected'
function managementModeFor(typeId: number | null | undefined): ManagementMode {
  if (typeId == null) return 'unselected'
  const entry = library.managingTypes.find(item => Number(item.id) === Number(typeId))
  if (!entry) return 'other'
  const label = `${entry.name} ${entry.alias ?? ''}`.toLowerCase()
  if (/\b(joint(?:ly)?|hybrid|mixed|co[\s_-]*managed|both)\b/.test(label)) return 'joint'
  if (/third[\s_-]*party|externally?|outsourc|vendor/.test(label)) return 'third-party'
  if (/internally?|in[\s_-]*house/.test(label)) return 'internal'
  return 'other'
}
const managementMode = computed<ManagementMode>(() => managementModeFor(form.value.desc.managing_type))
const showManagingOffice = computed(() => managementMode.value === 'internal' || managementMode.value === 'joint' || managementMode.value === 'other')
const showThirdPartyCompany = computed(() => managementMode.value === 'third-party' || managementMode.value === 'joint' || managementMode.value === 'other')
const isInternallyManaged = computed(() => showManagingOffice.value)
function onManagingTypeChanged(value: number | null): void {
  // Clear fields hidden by the newly selected mode; do not send stale associations.
  const mode = managementModeFor(value)
  if (mode === 'internal') form.value.desc.third_party_company = null
  if (mode === 'third-party') form.value.desc.managing_office = null
  if (mode === 'unselected') {
    form.value.desc.managing_office = null
    form.value.desc.third_party_company = null
  }
}
// Load Business Owner users and, only for internal/joint management, Managing Office users.
const stakeholderSourceDepartments = computed(() => {
  const ids: number[] = []
  const owner = Number(form.value.business_owner)
  const office = Number(form.value.desc.managing_office)
  if (Number.isInteger(owner) && owner > 0) ids.push(owner)
  if (isInternallyManaged.value && Number.isInteger(office) && office > 0 && !ids.includes(office)) ids.push(office)
  return ids
})
const projectManagerRole = computed(() => library.stakeholderTypes.find(role =>
  /project[\s_-]*manager/i.test(`${role.name} ${role.alias ?? ''}`),
))
const loggedInUserName = computed(() => {
  const user = auth.user
  if (!user) return 'Signed-in user'
  const details = user.details
  return [details?.first_name, details?.middle_name, details?.last_name, details?.ext_name]
    .filter(Boolean).join(' ') || user.username || user.email || `User #${user.id}`
})
const sectionSelections = ref<Record<StakeholderSectionKey, number[]>>({ owner: [], office: [] })
const sectionRoles = ref<Record<StakeholderSectionKey, number | null>>({ owner: null, office: null })
const departmentUsers = computed<StakeholderUser[]>(() => {
  const byId = new Map<number, StakeholderUser>()
  for (const departmentId of stakeholderSourceDepartments.value) {
    for (const user of departmentDirectory.value[departmentId] ?? []) {
      const id = Number(user.id)
      if (!Number.isInteger(id) || id <= 0) continue
      const previous = byId.get(id)
      if (previous) {
        if (!previous.departmentIds.includes(departmentId)) previous.departmentIds.push(departmentId)
      } else {
        byId.set(id, { id, name: user.name?.trim() || `User #${id}`, email: user.email ?? null, departmentIds: [departmentId] })
      }
    }
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name))
})
const stakeholderSections = computed(() => {
  const sections: { key: StakeholderSectionKey; title: string; departmentId: number | null; users: StakeholderUser[] }[] = [
    { key: 'owner', title: 'Business Owner', departmentId: form.value.business_owner ?? null, users: [] },
  ]
  if (isInternallyManaged.value) {
    sections.push({ key: 'office', title: 'Managing Office', departmentId: form.value.desc.managing_office ?? null, users: [] })
  }
  return sections.map(section => ({
    ...section,
    users: departmentUsers.value.filter(user => section.departmentId != null && user.departmentIds.includes(section.departmentId)),
  }))
})
async function loadDepartmentUsers(): Promise<void> {
  const version = ++departmentRequestVersion
  const ids = [...stakeholderSourceDepartments.value]
  departmentDirectory.value = {}
  departmentErrors.value = {}
  departmentLoadedIds.value = []
  sectionSelections.value = { owner: [], office: [] }
  if (!formOpen.value || ids.length === 0) {
    departmentUsersLoading.value = false
    return
  }
  departmentUsersLoading.value = true
  // One failed department must not hide successfully loaded users in the other.
  await Promise.all(ids.map(async departmentId => {
    try {
      const users = await libraryApi.departmentUsers(departmentId)
      if (version !== departmentRequestVersion) return
      departmentDirectory.value = { ...departmentDirectory.value, [departmentId]: users }
    } catch (error) {
      if (version !== departmentRequestVersion) return
      departmentErrors.value = { ...departmentErrors.value, [departmentId]: errorMessage(error) }
    } finally {
      if (version === departmentRequestVersion) departmentLoadedIds.value = [...departmentLoadedIds.value, departmentId]
    }
  }))
  if (version === departmentRequestVersion) departmentUsersLoading.value = false
}
function reloadDepartmentUsers(): void { void loadDepartmentUsers() }
function isStakeholderSelected(id: number): boolean {
  return form.value.stakeholders.some(item => Number(item.user_id) === id)
}
function stakeholderTypeFor(id: number): number | null {
  return form.value.stakeholders.find(item => Number(item.user_id) === id)?.stakeholder_type ?? null
}
function selectSectionUser(key: StakeholderSectionKey, id: number, checked: boolean | null): void {
  const current = sectionSelections.value[key]
  sectionSelections.value[key] = checked ? [...new Set([...current, id])] : current.filter(userId => userId !== id)
}
function allSectionUsersSelected(key: StakeholderSectionKey, users: StakeholderUser[]): boolean {
  return users.length > 0 && users.every(user => sectionSelections.value[key].includes(user.id))
}
function selectSectionUsers(key: StakeholderSectionKey, users: StakeholderUser[], checked: boolean | null): void {
  const ids = new Set(users.map(user => user.id))
  sectionSelections.value[key] = checked
    ? [...new Set([...sectionSelections.value[key], ...ids])]
    : sectionSelections.value[key].filter(id => !ids.has(id))
}
// The API stores a user ID and role, not an assignment-source department.
// Infer department membership from the loaded directory, without mislabeling unknown users.
const assignedStakeholderSections = computed(() => stakeholderSections.value.map(section => {
  const departmentId = section.departmentId
  const matching = form.value.stakeholders.filter(person =>
    departmentId != null && departmentUsers.value.some(user =>
      Number(user.id) === Number(person.user_id) && user.departmentIds.includes(departmentId),
    ),
  )
  const groups = library.stakeholderTypes.map(role => ({
    id: Number(role.id),
    name: role.name,
    users: matching.filter(person => Number(person.stakeholder_type) === Number(role.id)),
  })).filter(group => group.users.length > 0)
  return { ...section, users: matching, groups }
}))
const unclassifiedStakeholderGroups = computed(() => {
  const knownIds = new Set(assignedStakeholderSections.value.flatMap(section => section.users.map(user => Number(user.user_id))))
  const unknown = form.value.stakeholders.filter(person => !knownIds.has(Number(person.user_id)))
  return library.stakeholderTypes.map(role => ({
    id: Number(role.id), name: role.name,
    users: unknown.filter(person => Number(person.stakeholder_type) === Number(role.id)),
  })).filter(group => group.users.length > 0)
})
function assignSectionStakeholders(key: StakeholderSectionKey): void {
  const role = sectionRoles.value[key]
  if (role == null || !library.stakeholderTypes.some(item => Number(item.id) === Number(role))) {
    $q.notify({ type: 'warning', message: 'Choose a valid Stakeholder Type.' })
    return
  }
  const selectedIds = [...sectionSelections.value[key]]
  if (!selectedIds.length) return
  // The Registry payload allows one stakeholder type per user; assigning the same
  // user from a second department updates that user's role rather than duplicating it.
  const assignments = new Map(form.value.stakeholders.map(item => [Number(item.user_id), item]))
  for (const id of selectedIds) assignments.set(id, { user_id: id, stakeholder_type: Number(role) })
  form.value.stakeholders = [...assignments.values()]
  sectionSelections.value[key] = []
  sectionRoles.value[key] = null
  $q.notify({ type: 'positive', message: `${selectedIds.length} user${selectedIds.length === 1 ? '' : 's'} assigned successfully.` })
}
function removeStakeholder(id: number): void {
  form.value.stakeholders = form.value.stakeholders.filter(item => Number(item.user_id) !== id)
}
function userDisplayName(id: number): string {
  const user = departmentUsers.value.find(item => item.id === Number(id))
  if (user) return user.email ? `${user.name} (${user.email})` : user.name
  if (Number(auth.user?.id) === Number(id)) return `${loggedInUserName.value} (you)`
  return `User #${id}`
}
function userInitials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part.charAt(0).toUpperCase()).join('') || '?'
}
watch(
  () => [formOpen.value, form.value.business_owner, form.value.desc.managing_office, isInternallyManaged.value, formStep.value === 4] as const,
  () => { void loadDepartmentUsers() },
)


function emptyForm(): RegistryForm {
  return {
    system_name: '', alias: '', description: '', business_owner: null, status: null,
    desc: { managing_type: null, managing_office: null, third_party_company: null, project_roll_on: null, project_sign_off: null, estimation_project_duration: null },
    repo: { development_solution_type: null, repo_git: null, staging_url: null, production_url: null,
      frontend_repo_git: null, frontend_staging_url: null, frontend_production_url: null,
      backend_repo_git: null, backend_staging_url: null, backend_production_url: null },
    tech_stack: { frontend_stack: [], backend_stack: [], database: null, server_type: null, server_name: null },
    stakeholders: [], docs: initialRegistryDocs(),
  }
}

const repositoryScopes = ['frontend', 'backend'] as const
const isFullstackSolution = computed(() => {
  const option = library.developmentSolutionTypes.find(item => Number(item.id) === Number(form.value.repo.development_solution_type))
  return Boolean(option && /^FULLSTACK$/i.test(option.name.replace(/[^a-z]/gi, '')))
})
function solutionTypeIcon(label: string): string {
  const token = label.toUpperCase().replace(/[^A-Z]/g, '')
  if (token === 'FULLSTACK') return 'layers'
  if (token === 'FRONTEND') return 'desktop_windows'
  if (token === 'BACKEND') return 'dns'
  if (token === 'MOBILE') return 'smartphone'
  return 'computer'
}
function selectDevelopmentSolution(id: number): void {
  // Keep both sets of values while switching the UI. Only the selected mode is submitted.
  form.value.repo.development_solution_type = id
}
function reposFromApi(record: RegistryApiWithRepos): RegistryRepositoryForm {
  const current = record.repo ?? null
  const result: RegistryRepositoryForm = {
    repo_git: current?.repo_git ?? null,
    staging_url: current?.staging_url ?? null,
    production_url: current?.production_url ?? null,
    development_solution_type: current?.development_solution_type ?? null,
  }
  for (const repo of record.repos ?? []) {
    if (repo.repo_scope === 'frontend' || repo.repo_scope === 'backend') {
      const scope = repo.repo_scope
      result[`${scope}_repo_git`] = repo.repo_git ?? null
      result[`${scope}_staging_url`] = repo.staging_url ?? null
      result[`${scope}_production_url`] = repo.production_url ?? null
    } else if (repo.repo_scope === 'single') {
      result.repo_git = repo.repo_git ?? null
      result.staging_url = repo.staging_url ?? null
      result.production_url = repo.production_url ?? null
    }
    result.development_solution_type ??= repo.development_solution_type ?? null
  }
  // Supports an API that returns the six scoped values in the legacy repo object.
  return { ...result, ...(current ?? {}) }
}
const departmentOptions = computed(() => library.departments)
const selectedStatusName = computed(() => library.registryStatuses.find(item => Number(item.id) === Number(form.value.status))?.name ?? '')
const statusOptions = computed(() => library.registryStatuses.map(item => ({ label: item.name, value: item.id })))
const filteredSystems = computed(() => systems.value.filter((item) => {
  const term = (search.value || '').trim().toLowerCase()
  const matches = !term || [item.system_name, item.alias, item.description, departmentLabel(item.business_owner)]
    .some(value => String(value || '').toLowerCase().includes(term))
  return matches && (statusFilter.value === null || Number(item.status) === Number(statusFilter.value))
}))
const statistics = computed(() => {
  const countStatus = (tokens: string[]) => systems.value.filter(item => {
    const label = statusLabel(item.status).toLowerCase()
    return tokens.some(token => label.includes(token))
  }).length
  return [
    { label: 'TOTAL SYSTEMS', count: systems.value.length, description: 'Registered information systems', icon: 'layers', theme: 'total' },
    { label: 'DEPLOYED', count: countStatus(['deployed', 'active', 'operational']), description: 'Live systems', icon: 'check_circle', theme: 'active' },
    { label: 'FOR DEPLOYMENT', count: countStatus(['for deployment', 'pending deployment']), description: 'Awaiting rollout', icon: 'hourglass_top', theme: 'review' },
    { label: 'UNDER DEVELOPMENT', count: countStatus(['development', 'in progress']), description: 'In development', icon: 'build_circle', theme: 'development' },
    { label: 'DECOMMISSIONED', count: countStatus(['decommission', 'retired', 'archiv']), description: 'Retired systems', icon: 'inventory_2', theme: 'archived' },
  ]
})
const columns: QTableColumn<RegistryRecord>[] = [
  { name: 'system_name', label: 'SYSTEM NAME', field: 'system_name', align: 'left', sortable: true },
  { name: 'alias', label: 'ALIAS', field: row => row.alias || '—', align: 'left', sortable: true },
  { name: 'business_owner', label: 'BUSINESS OWNER', field: row => departmentLabel(row.business_owner), align: 'left', sortable: true },
  { name: 'status', label: 'STATUS', field: row => statusLabel(row.status), align: 'left', sortable: true },
  { name: 'updated_at', label: 'UPDATED', field: row => row.updated_at || '', align: 'left', sortable: true },
  { name: 'actions', label: 'ACTIONS', field: 'id', align: 'center' },
]

function requiredText(value: unknown): true | string {
  return (typeof value === 'string' && value.trim().length > 0) || 'This field is required'
}
function requiredId(value: unknown): true | string { return Number(value) > 0 || 'Select a valid option' }
function techLabel(item: LibraryOption): string { return item.version ? `${item.name} (${item.version})` : item.name }
function statusLabel(id: number | null | undefined): string { return library.labelFor('registryStatuses', id) }
function departmentLabel(id: number | null | undefined): string { return library.labelFor('departments', id) }
function stackNames(ids: number[] | undefined): string {
  return ids?.length ? ids.map(id => library.labelFor('techStacks', id)).join(', ') : '—'
}
function stakeholderNames(items: RegistryRecord['stakeholders']): string {
  return items?.length ? items.map(item => `User #${item.user_id} (${library.labelFor('stakeholderTypes', item.stakeholder_type)})`).join('; ') : '—'
}
function documentNames(items: RegistryRecord['docs']): string {
  return items?.length ? items.map(item => `${library.labelFor('documentTypes', item.docs_type)}: ${item.file_path}`).join('; ') : '—'
}
function statusClass(label: string): string {
  const lower = label.toLowerCase()
  return lower.includes('for deployment') ? 'is-review' : lower.includes('development') ? 'is-development' : lower.includes('decommission') || lower.includes('archiv') || lower.includes('retir') ? 'is-archived' : ''
}
function formatDate(raw?: string): string {
  if (!raw) return '—'
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium' }).format(date)
}
function normalizeRecord(row: RegistryRecord): RegistryRecord {
  // RegistryResource may expose the related model as `registry_desc` rather than `desc`.
  const extra = row as RegistryRecord & { registry_desc?: RegistryPayload['desc']; registryDesc?: RegistryPayload['desc'] }
  return { ...row, desc: row.desc ?? extra.registry_desc ?? extra.registryDesc ?? null }
}
async function loadRegistries(): Promise<void> {
  if (loading.value) return
  // Keep existing rows visible during refresh; spinner is only shown for the first load.
  loading.value = true
  loadError.value = ''
  try {
    const response = await registryApi.list()
    if (!response.success || !Array.isArray(response.data)) throw new Error(response.message || 'Unable to load registries')
    systems.value = response.data.map(normalizeRecord)
  } catch (error) {
    loadError.value = errorMessage(error)
    $q.notify({ type: 'negative', message: loadError.value })
  } finally { loading.value = false }
}
async function loadLibraries(): Promise<void> {
  const results = await Promise.allSettled([library.load('departments'), library.loadRegistryLibraries()])
  if (results.some(result => result.status === 'rejected')) {
    $q.notify({ type: 'warning', message: 'Some Library options could not be loaded. Check Library API availability.' })
  }
}
function openAddSystemChoice(): void {
  addChoiceOpen.value = true
}
function chooseNewSystem(): void {
  addChoiceOpen.value = false
  openCreate()
}
function chooseExistingSystem(): void {
  addChoiceOpen.value = false
  existingQuery.value = ''
  existingSearchOpen.value = true
  void loadRegistries()
}
async function selectExistingSystem(id: number): Promise<void> {
  if (existingOpening.value) return
  existingOpeningId.value = id
  try {
    await openEdit(id)
    if (formOpen.value) existingSearchOpen.value = false
  } finally { existingOpeningId.value = null }
}
/** Use the authenticated account from /view; never infer a user ID from a department listing. */
async function autoAssignProjectManager(): Promise<boolean> {
  try {
    await Promise.all([auth.ensureInitialized(), library.load('stakeholderTypes')])
    const userId = Number(auth.user?.id)
    if (!Number.isInteger(userId) || userId <= 0) {
      $q.notify({ type: 'warning', message: 'Your logged-in account could not be verified. Sign in again to auto-assign the Project Manager.' })
      return false
    }
    const projectManager = projectManagerRole.value
    if (!projectManager) {
      $q.notify({ type: 'warning', message: 'Project Manager is missing from the Stakeholder Type Library.' })
      return false
    }
    // Preserve a user's existing role because the current Registry payload supports only one role per user.
    const current = form.value.stakeholders.find(item => Number(item.user_id) === userId)
    if (!current) {
      form.value.stakeholders = [
        ...form.value.stakeholders,
        { user_id: userId, stakeholder_type: Number(projectManager.id) },
      ]
    } else if (Number(current.stakeholder_type) !== Number(projectManager.id)) {
      // Do not silently replace a stakeholder role on existing systems.
      $q.notify({ type: 'info', message: 'Your account already has a different stakeholder type on this system; it was preserved.' })
      return false
    }
    return true
  } catch (error) {
    $q.notify({ type: 'negative', message: `Unable to assign Project Manager: ${errorMessage(error)}` })
    return false
  }
}
function openCreate(): void {
  detailsApiRecord.value = null
  // Render the dialog immediately: do not block opening on seven library requests.
  editingId.value = null
  form.value = emptyForm()
  resetDocumentWorkspace()
  sectionSelections.value = { owner: [], office: [] }
  sectionRoles.value = { owner: null, office: null }
  formStep.value = 1
  formOpen.value = false
  profileOpen.value = true
  void loadLibraries()
  void autoAssignProjectManager()
}
async function getRecord(id: number): Promise<RegistryRecord> {
  const response = await registryApi.view(id)
  if (!response.success || !response.data) throw new Error(response.message || 'Registry not found')
  return normalizeRecord(response.data)
}
async function openView(id: number): Promise<void> {
  try {
    selected.value = await getRecord(id)
    viewOpen.value = true
  } catch (error) { $q.notify({ type: 'negative', message: errorMessage(error) }) }
}
async function openEdit(id: number): Promise<void> {
  try {
    // Loading dropdowns is independent of getting the record.
    void loadLibraries()
    const item = await getRecord(id)
    detailsApiRecord.value = item as unknown as DetailsApiRecord
    const blank = emptyForm()
    form.value = {
      ...blank,
      system_name: item.system_name,
      alias: item.alias ?? '',
      description: item.description ?? '',
      business_owner: item.business_owner ?? null,
      status: item.status,
      desc: { ...blank.desc, ...(item.desc ?? {}) },
      repo: { ...blank.repo, ...reposFromApi(item) },
      tech_stack: { ...blank.tech_stack, ...(item.tech_stack ?? {}), frontend_stack: [...(item.tech_stack?.frontend_stack ?? [])], backend_stack: [...(item.tech_stack?.backend_stack ?? [])] },
      stakeholders: (item.stakeholders ?? []).map(i => ({ user_id: i.user_id, stakeholder_type: i.stakeholder_type })),
      docs: registryDocsForEdit((item.docs ?? []).map(i => ({ docs_type: i.docs_type, file_path: i.file_path }))),
    }
    editingId.value = id
    resetDocumentWorkspace()
    // Recognize stored draft markers as pending workflow items, not uploaded files.
    form.value.docs.forEach((doc, index) => {
      if (doc.file_path?.startsWith(PENDING_DRAFT_PREFIX)) {
        documentDraftNames.value[String(index)] = `${library.labelFor('documentTypes', Number(doc.docs_type))} — Draft (content not stored)`
      }
    })
      sectionSelections.value = { owner: [], office: [] }
    sectionRoles.value = { owner: null, office: null }
    formStep.value = 1
    profileOpen.value = false
    formOpen.value = true
    // Existing systems keep their persisted stakeholders; initiation assigns PM only for new systems.
  } catch (error) { $q.notify({ type: 'negative', message: errorMessage(error) }) }
}
function optionalText(value?: string | null): string | null { return value?.trim() || null }
function payloadForSave(): RegistryPayload {
  const value = form.value
  return {
    system_name: value.system_name.trim(), alias: optionalText(value.alias), description: optionalText(value.description),
    business_owner: value.business_owner ?? null, status: value.status ?? 0,
    desc: {
      managing_type: value.desc.managing_type ?? null, managing_office: value.desc.managing_office ?? null,
      third_party_company: optionalText(value.desc.third_party_company),
      project_roll_on: value.desc.project_roll_on || null, project_sign_off: value.desc.project_sign_off || null,
      estimation_project_duration: value.desc.estimation_project_duration === null || value.desc.estimation_project_duration === undefined || String(value.desc.estimation_project_duration) === '' ? null : Number(value.desc.estimation_project_duration),
    },
    repo: value.repo.development_solution_type != null ? (
      isFullstackSolution.value ? {
        development_solution_type: value.repo.development_solution_type,
        // Backend service must persist these as two rows identified by repo_scope.
        frontend_repo_git: optionalText(value.repo.frontend_repo_git),
        frontend_staging_url: optionalText(value.repo.frontend_staging_url),
        frontend_production_url: optionalText(value.repo.frontend_production_url),
        backend_repo_git: optionalText(value.repo.backend_repo_git),
        backend_staging_url: optionalText(value.repo.backend_staging_url),
        backend_production_url: optionalText(value.repo.backend_production_url),
      } : {
        development_solution_type: value.repo.development_solution_type,
        repo_git: optionalText(value.repo.repo_git),
        staging_url: optionalText(value.repo.staging_url),
        production_url: optionalText(value.repo.production_url),
      }
    ) : null,
    tech_stack: {
      frontend_stack: value.tech_stack.frontend_stack ?? [], backend_stack: value.tech_stack.backend_stack ?? [],
      database: optionalText(value.tech_stack.database), server_type: optionalText(value.tech_stack.server_type), server_name: optionalText(value.tech_stack.server_name),
    },
    stakeholders: value.stakeholders.map(item => ({ user_id: Number(item.user_id), stakeholder_type: Number(item.stakeholder_type) })),
    docs: docsForRegistryPayload(),
  }
}
function validProfile(): boolean {
  if (!form.value.system_name.trim()) {
    $q.notify({ type: 'warning', message: 'Enter a system name before continuing.' })
    return false
  }
  if (form.value.status === null || !library.registryStatuses.some(item => Number(item.id) === Number(form.value.status))) {
    $q.notify({ type: 'warning', message: 'Select a valid Registry Status. If the list is empty, reload the Library.' })
    return false
  }
  return true
}
/** Creation happens ONCE, on System Profile. Every subsequent save updates that Registry ID. */
async function initiateSystem(): Promise<void> {
  if (saving.value || editingId.value !== null || !validProfile()) return
  saving.value = true
  try {
    // Check identity and Project Manager role before creating any backend record.
    if (!await autoAssignProjectManager()) return
    const payload = payloadForSave()
    // docsForRegistryPayload() includes BRD, SRS, SDD and User Stories as pending records.
    const response = await registryApi.create(payload)
    if (!response.success) throw new Error(response.message || 'Unable to initiate system')

    const createdId = Number(response.data?.id)
    if (!Number.isSafeInteger(createdId) || createdId <= 0) {
      // The POST may already have succeeded. Never repeat it automatically, or users risk duplicate IS records.
      profileOpen.value = false
      $q.notify({ type: 'warning', timeout: 9000, message: 'System was created, but the API did not return its ID. Find it in Existing Information Systems to continue; do not click Initiate again.' })
      await loadRegistries()
      return
    }
    editingId.value = createdId
    detailsApiRecord.value = (response.data ?? { id: createdId }) as DetailsApiRecord
    // Refresh the server-generated relation details and timestamps without blocking the modal.
    void getRecord(createdId).then(record => {
      if (editingId.value === createdId) detailsApiRecord.value = record as unknown as DetailsApiRecord
    }).catch(() => { /* The editable form remains available if this read fails. */ })
    formStep.value = 2
    profileOpen.value = false
    formOpen.value = true
    $q.notify({ type: 'positive', message: `System initiated (#${createdId}). Project Manager and four initial document records were submitted.` })
    await loadRegistries()
  } catch (error) {
    $q.notify({ type: 'negative', message: `Unable to initiate system: ${errorMessage(error)}` })
  } finally {
    saving.value = false
  }
}
function goToStep(target: number): void {
  if (saving.value || target < 1 || target > stepLabels.length || target === formStep.value) return
  if (target > 1 && editingId.value === null) {
    $q.notify({ type: 'warning', message: 'Click Initiate on System Profile to create this system before continuing.' })
    formStep.value = 1
    return
  }
  if (target > 1 && !validProfile()) { formStep.value = 1; return }
  formStep.value = target
}
function nextStep(): void {
  goToStep(formStep.value + 1)
}
async function saveSystem(): Promise<void> {
  if (saving.value) return
  if (!form.value.system_name.trim() || form.value.status === null ||
      !library.registryStatuses.some(item => Number(item.id) === Number(form.value.status))) {
    formStep.value = 1
    $q.notify({ type: 'warning', message: 'Complete the required System Profile fields.' })
    return
  }
  if (editingId.value === null) {
    $q.notify({ type: 'warning', message: 'Initiate the system from the Details / System Profile step first.' })
    formStep.value = 1
    return
  }
  saving.value = true
  try {
    if (form.value.stakeholders.some(item => !item.stakeholder_type || !library.stakeholderTypes.some(t => Number(t.id) === Number(item.stakeholder_type)))) {
      formStep.value = 4
      $q.notify({ type: 'warning', message: 'Assign a valid stakeholder role to every selected user.' })
      return
    }
    const payload = payloadForSave()
    const response = await registryApi.update(editingId.value, payload)
    if (!response.success) throw new Error(response.message || 'Failed to update registry')
    formOpen.value = false
    $q.notify({ type: 'positive', message: 'System updated successfully.' })
    $q.notify({ type: 'info', timeout: 6500, message: 'Document records have been saved. Pending paths are placeholders; files, draft contents, and task assignments are not uploaded or stored.' })
    await loadRegistries()
  } catch (error) { $q.notify({ type: 'negative', message: errorMessage(error) }) }
  finally { saving.value = false }
}
function confirmDelete(item: RegistryRecord): void {
  $q.dialog({ title: 'Permanently delete system?', message: `Delete ${item.system_name} and its related records? This cannot be undone.`, cancel: true, persistent: true })
    .onOk(() => { void deleteSystem(item.id) })
}
async function deleteSystem(id: number): Promise<void> {
  try {
    const response = await registryApi.delete(id)
    if (!response.success) throw new Error(response.message || 'Unable to delete system')
    $q.notify({ type: 'positive', message: 'System deleted successfully.' })
    await loadRegistries()
  } catch (error) { $q.notify({ type: 'negative', message: errorMessage(error) }) }
}

onMounted(() => {
  // Registry list is its own request. Only load two libraries required for table labels.
  // Defer the other seven dropdown libraries until a user opens the registration form.
  void loadRegistries()
  void Promise.allSettled([library.load('departments'), library.load('registryStatuses')])
})
</script>

<style scoped lang="scss">
/* Registration wizard: interactive, compact, responsive cards */
.registry-wizard-header{display:flex;align-items:center;gap:15px;padding:22px 26px;background:linear-gradient(112deg,#f3f4ff,#fff 65%)}
.registry-wizard-header__icon{display:grid;place-items:center;width:52px;height:52px;border-radius:15px;flex-shrink:0;background:#e5e7ff;color:#2e3092}
.registry-wizard-header__copy{flex:1;min-width:0}
.registry-wizard-steps{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:9px;margin:0 0 20px}
.registry-wizard-step{display:flex;align-items:center;text-align:left;gap:10px;padding:13px 10px;background:#f6f7fb;border:1px solid #e3e6f0;border-radius:12px;color:#67738f;font-size:12px;font-weight:750;min-width:0;cursor:pointer;transition:background .16s,border-color .16s,box-shadow .16s;font-family:inherit}
.registry-wizard-step:hover:not(:disabled){background:#ebedff;border-color:#a6a9e5}
.registry-wizard-step:focus-visible{outline:3px solid #9c9ff0;outline-offset:2px}
.registry-wizard-step:disabled{opacity:.55;cursor:not-allowed}
.registry-wizard-step__label{line-height:1.35;flex:1;min-width:0}
.registry-wizard-step__arrow{flex:none}
.registry-wizard-step.is-current{background:#eeefff;border-color:#494ba9;color:#282b89;box-shadow:0 0 0 1px #494ba9 inset}
.registry-wizard-step.is-complete{color:#3f449b;border-color:#d3d6ef;background:#f8f8ff}
.registry-wizard-content{display:flex;flex-direction:column;gap:12px;min-height:215px}
@media(max-width:700px){.registry-wizard-steps{grid-template-columns:repeat(2,minmax(0,1fr))}.registry-wizard-header{padding:15px}.registry-wizard-header__icon{width:42px;height:42px}.registry-wizard-step{padding:10px 8px}}

/* Registry editor visual refresh — ONE ICTMS palette, no change to form logic. */
.registry-dialog--editor{
  width:min(1220px,96vw)!important;
  max-width:1220px!important;
  height:min(880px,93dvh);
  max-height:93dvh;
  border-radius:20px;
  box-shadow:0 26px 90px rgba(27,39,92,.20);
}
.registry-dialog--editor .registry-wizard-header{
  gap:17px;
  padding:22px 30px;
  background:#fff;
  border-bottom:1px solid #edf0f7;
}
.registry-dialog--editor .registry-wizard-header__icon{
  width:51px;height:51px;border-radius:15px;
  background:#eef0ff;color:#373ca6;
  display:grid;place-items:center;flex:none;
}
.registry-wizard-header__copy{min-width:0;flex:1}
.registry-wizard-header__eyebrow{font-size:10px;letter-spacing:.12em;font-weight:800;color:#777fb4;margin-bottom:3px}
.registry-wizard-header__subtitle{margin:4px 0 0;color:#7784a3;font-size:12px;line-height:1.45}
.registry-dialog--editor .registry-wizard-header__copy .text-h6{font-size:21px;line-height:1.3;color:#202653;letter-spacing:-.025em}
.registry-dialog--editor .registry-wizard-header__aside .q-btn{color:#4a567e;background:#f6f7fc}
.registry-wizard-progress{height:3px;background:#eff1fc}
.registry-wizard-progress__fill{background:#4648bd}
.registry-wizard-layout{grid-template-columns:226px minmax(0,1fr)}
.registry-wizard-sidebar{background:#f8f9fd;border-right:1px solid #e9edf6;padding:20px 12px;gap:13px}
.registry-dialog--editor .registry-wizard-steps{gap:5px}
.registry-dialog--editor .registry-wizard-step{
  min-height:47px;padding:10px 14px;
  font-size:12px;border-radius:10px;color:#65708e;
  transition:background .16s,border-color .16s;
}
.registry-dialog--editor .registry-wizard-step:hover:not(:disabled){transform:none;background:#eff0fc;border-color:#e1e4fa}
.registry-dialog--editor .registry-wizard-step.is-current{
  color:#343ca0;background:#e9ebff;border-color:#cbd0ff;
  box-shadow:none;position:relative;
}
.registry-dialog--editor .registry-wizard-step.is-current::before{
  content:'';position:absolute;left:0;top:11px;bottom:11px;width:3px;
  background:#494cc4;border-radius:0 3px 3px 0;
}
.registry-dialog--editor .registry-wizard-step.is-complete{
  background:transparent;color:#66738f;border-color:transparent;
}
.registry-dialog--editor .registry-wizard-main{
  padding:29px clamp(22px,3vw,44px) 38px;
  background:#fbfcff;
}
.registry-dialog--editor .registry-details-view{gap:18px;padding-bottom:20px}
.registry-details-section--unboxed{display:flex;flex-direction:column;gap:16px}
.registry-overview-block,
.registry-overview-block:first-of-type{
  border:1px solid #e3e8f5;
  background:#fff;
  border-radius:15px;
  padding:21px 23px;
  margin:0;
  box-shadow:0 3px 12px rgba(30,47,105,.025);
}
.registry-overview-block__heading{gap:10px;margin-bottom:18px;color:#464ab2}
.registry-overview-block__heading h5{font-size:14px;color:#222958;font-weight:800}
.registry-details-section__fields{column-gap:36px;row-gap:21px}
.registry-details-readonly__item{padding:0}
.registry-details-readonly__item dt{font-size:11px;color:#8491ac;margin-bottom:7px;letter-spacing:0}
.registry-details-readonly__item dd{font-size:13px;color:#242b62;line-height:1.5}
.registry-details-readonly__item--prominent dd{font-size:24px;line-height:1.3}
.registry-overview-list__row{padding:12px 0}
.registry-wizard-footer{border-top:1px solid #e9edf7;background:#fff;min-height:70px;padding:12px 24px!important}
.registry-wizard-footer .q-btn{min-height:41px;border-radius:9px}
@media(max-width:900px){
  .registry-wizard-layout{grid-template-columns:1fr;grid-template-rows:auto minmax(0,1fr)}
  .registry-dialog--editor .registry-wizard-header{padding:16px 21px}
  .registry-dialog--editor .registry-wizard-main{padding:22px}
  .registry-wizard-sidebar{padding:10px 15px;gap:5px}
}
@media(max-width:600px){
  .registry-dialog--editor{width:100vw!important;max-width:100vw!important;height:100dvh;max-height:100dvh;border-radius:0}
  .registry-dialog--editor .registry-wizard-header{padding:12px 15px;gap:11px}
  .registry-dialog--editor .registry-wizard-header__icon{width:40px;height:40px;border-radius:11px}
  .registry-wizard-header__subtitle{display:none}
  .registry-dialog--editor .registry-wizard-main{padding:15px}
  .registry-overview-block,.registry-overview-block:first-of-type{padding:17px 15px;border-radius:12px}
  .registry-details-section__fields{grid-template-columns:1fr;gap:16px}
  .registry-wizard-footer{padding:10px!important}
}
</style>

<style scoped lang="scss">
.registry-page{color:#202558;max-width:1600px;margin:0 auto;padding-top:48px;padding-bottom:55px}.registry-heading{margin-bottom:26px}.registry-heading h1{font-size:clamp(2.2rem,3.3vw,3.35rem);line-height:1.08;font-weight:850;letter-spacing:-.055em;margin:13px 0 8px;color:#222560}.registry-heading p,.registry-panel__heading p{color:#8493b6;font-size:15px;margin:0}.registry-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:26px}.registry-stat{background:#fff;border:1px solid #dfe4f1;border-radius:18px;padding:21px 22px;min-width:0;min-height:160px;box-shadow:0 8px 22px rgba(36,48,101,.025)}.registry-stat__top{display:flex;justify-content:space-between;align-items:center;font-size:12px;font-weight:850;letter-spacing:.095em;color:#3432af}.registry-stat__body{display:flex;align-items:center;gap:19px;margin-top:19px}.registry-stat__icon{display:grid;place-items:center;flex-shrink:0;width:66px;height:66px;border-radius:20px;background:#eef0ff;color:#3236c4}.registry-stat strong{font-size:37px;line-height:1;font-weight:850;color:#20245f;letter-spacing:-.06em}.registry-stat p{color:#8b9abc;margin:5px 0 0;font-size:12px;line-height:1.35}.registry-stat--active .registry-stat__top,.registry-stat--active .registry-stat__icon{color:#009a65}.registry-stat--active .registry-stat__icon{background:#e5f8f0}.registry-stat--review .registry-stat__top,.registry-stat--review .registry-stat__icon{color:#cb7800}.registry-stat--review .registry-stat__icon{background:#fff5db}.registry-stat--archived .registry-stat__top,.registry-stat--archived .registry-stat__icon{color:#d21d37}.registry-stat--archived .registry-stat__icon{background:#fff0f2}.registry-panel{background:white;border:1px solid #dfe5f2;border-radius:19px;padding:20px;box-shadow:0 12px 35px rgba(30,46,100,.03)}.registry-panel__heading{display:flex;gap:20px;justify-content:space-between;align-items:center;margin-bottom:18px}.registry-panel__heading h2{color:#1c225b;font-size:24px;line-height:1.2;font-weight:850;letter-spacing:-.045em;margin:0 0 5px}.registry-actions{display:flex;align-items:center;gap:12px}.registry-search{width:290px;max-width:32vw}.registry-filter{color:#262d82;border-color:#e2e6f0;height:40px;padding-inline:12px}.registry-add{background:#2d2bb0;color:#fff;border-radius:9px;height:40px;padding:0 18px;font-weight:750}.registry-table{color:#3b4c7f}.registry-table :deep(thead tr){background:#f0f3f9}.registry-table :deep(th){color:#60749e;font-weight:850;font-size:10px;letter-spacing:.09em;white-space:nowrap;padding-top:15px;padding-bottom:15px}.registry-table :deep(td){border-color:#edf0f6;padding-top:10px;padding-bottom:10px;font-size:12px}.registry-system-cell{display:flex;align-items:center;gap:14px;min-width:260px;text-align:left}.registry-system-icon{height:40px;width:40px;flex-shrink:0;border-radius:9px;display:grid;place-items:center}.registry-system-cell strong{display:block;font-size:12px;color:#171c59;font-weight:800;white-space:normal}.registry-system-cell small,.registry-updated small{display:block;color:#8498bc;font-size:11px;margin-top:3px}.registry-pill{display:inline-flex;align-items:center;white-space:nowrap;border-radius:9px;font-size:11px;padding:6px 10px}.registry-pill--category{background:#eaf0ff;color:#3245c5}.registry-pill--category.is-hr{background:#ffebee;color:#c92a43}.registry-pill--category.is-finance{background:#fff4df;color:#b77900}.registry-pill--category.is-procurement{background:#efebff;color:#6842ca}.registry-pill--category.is-assets{background:#e9edf3;color:#657590}.registry-pill--status{gap:9px;background:#e7f7ef;color:#09865e}.registry-pill--status.is-review{background:#fff5dd;color:#c17900}.registry-pill--status.is-archived{background:#ffecf0;color:#c62743}.registry-pill__dot{height:9px;width:9px;border-radius:50%;background:currentColor}.registry-updated{font-size:12px;color:#364b7d;white-space:nowrap}.registry-dialog{width:min(700px,96vw);max-width:700px;border-radius:19px}.registry-form{display:flex;flex-direction:column;gap:8px;padding-top:24px}.registry-form__grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.registry-details h3{font-size:21px;font-weight:800;margin:0 0 10px}.registry-details p{color:#687797}.registry-details dl{display:grid;grid-template-columns:140px 1fr;gap:12px;margin:20px 0}.registry-details dt{color:#8793b2}.registry-details dd{margin:0;font-weight:600;overflow-wrap:anywhere}
@media(max-width:1200px){.registry-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.registry-panel__heading{align-items:flex-start;flex-direction:column}.registry-search{width:300px;max-width:100%}}
@media(max-width:700px){.registry-page{padding-top:26px}.registry-stats{gap:10px}.registry-stat{padding:14px;min-height:132px}.registry-stat__body{gap:10px}.registry-stat__icon{height:46px;width:46px;border-radius:13px}.registry-stat strong{font-size:30px}.registry-stat__top{font-size:10px}.registry-stat p{font-size:11px}.registry-panel{padding:12px}.registry-actions{width:100%;flex-wrap:wrap}.registry-search{width:100%;max-width:none;flex:1 1 100%}.registry-form__grid{grid-template-columns:1fr}}

.registry-dialog--wide{width:min(900px,96vw);max-width:900px}.registry-form--scroll{max-height:65vh;overflow-y:auto}.registry-group-title{font-weight:800;font-size:14px;color:#252c7c;margin:16px 0 8px;padding-bottom:8px;border-bottom:1px solid #e7eaf2}.registry-inline-row{align-items:start}
</style>


<style scoped>
.registry-stakeholder-toolbar{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.registry-stakeholder-sources{display:flex;flex-wrap:wrap;gap:6px;align-items:center;flex:1 1 250px;min-width:0}
.registry-stakeholder-search{flex:1 1 240px;min-width:180px}
.registry-stakeholder-list{border:1px solid #e1e5ef;border-radius:12px;overflow:hidden;max-height:345px;overflow-y:auto;background:white}
.registry-stakeholder-item{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid #edf0f6}
.registry-stakeholder-item:last-child{border-bottom:0}
.registry-stakeholder-person{flex:1 1 180px;min-width:0;display:flex;flex-direction:column;gap:2px}
.registry-stakeholder-person strong{font-size:13px;color:#232867;overflow-wrap:anywhere}
.registry-stakeholder-person span{font-size:11px;color:#7d89a0;overflow-wrap:anywhere}
.registry-stakeholder-office{color:#4b5994!important}
.registry-stakeholder-role{width:210px;flex:none;text-align:left}
.registry-stakeholder-empty{padding:25px;text-align:center;color:#7d89a0;background:#f8f9fd;border:1px dashed #d8ddec;border-radius:12px}
@media(max-width:620px){.registry-stakeholder-item{flex-wrap:wrap}.registry-stakeholder-role{width:100%;flex:1 1 100%}}

/* Details tab only: structured, compact and readable in the existing editor modal. */
.registry-dialog--editor .registry-details-view{gap:20px;min-height:0;padding-bottom:12px}
.registry-details-section{border:1px solid #e5e9f3;border-radius:16px;padding:20px 22px 23px;background:#fff;box-shadow:0 2px 10px rgba(23,38,86,.025)}
.registry-details-section--unboxed{border:0;border-radius:0;padding:0;background:transparent;box-shadow:none}
.registry-details-section__header{display:flex;align-items:flex-start;gap:12px;margin-bottom:19px}
.registry-details-section__number{display:grid;place-items:center;width:31px;height:31px;flex:none;border-radius:9px;background:#f0f2ff;color:#414dab;font-size:11px;font-weight:900}
.registry-details-section__header h4{margin:1px 0 4px;font-size:14px;font-weight:800;color:#232b5a;line-height:1.35}
.registry-details-section__header p{margin:0;font-size:12px;color:#8190a7;line-height:1.45}
.registry-details-section__fields{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px;align-items:start}
.registry-details-section__fields > .q-field,.registry-details-section__description{min-width:0;width:100%}
.registry-details-section__description textarea{min-height:74px}
.registry-details-readonly{margin:0;padding:0;list-style:none}
.registry-details-readonly__item{min-width:0;padding:4px 0;background:transparent;border:0;border-radius:0}
.registry-details-readonly__item--wide{grid-column:1 / -1}
.registry-details-readonly__description-value{white-space:pre-wrap;font-weight:500!important}
.registry-details-readonly__item dt{font-size:11px;letter-spacing:.02em;color:#8390ad;font-weight:700;margin:0 0 7px}
.registry-details-readonly__item dd{margin:0;color:#232a5e;font-size:14px;font-weight:700;line-height:1.55;overflow-wrap:anywhere}
.registry-details-readonly__item--prominent dd{font-size:24px;font-weight:800;line-height:1.3;letter-spacing:-.025em;color:#20285b}
.registry-details-readonly__item--prominent dt{font-size:12px;margin-bottom:8px}
.registry-details-readonly__status{display:inline-flex;align-items:center;padding:5px 11px;border-radius:9px;background:#e8f6ee;color:#16805a;font-size:12px;font-weight:800}
.registry-details-readonly__status.is-review{background:#fff4dd;color:#a86b00}
.registry-details-readonly__status.is-archived{background:#fff0f3;color:#c13650}
.registry-details-readonly__description{padding:16px 18px;background:#f8faff;border:1px solid #edf0f8;border-radius:12px;white-space:pre-wrap;overflow-wrap:anywhere;color:#313b6c;line-height:1.7;font-size:14px}
@media(max-width:700px){.registry-details-section{padding:16px}.registry-details-section__fields{grid-template-columns:1fr;gap:14px}}

.registry-overview-block{border-top:1px solid #e8edf5;padding-top:21px;margin-top:23px}
.registry-overview-block:first-of-type{border-top:0;margin-top:0;padding-top:0}
.registry-overview-block__heading{display:flex;align-items:center;gap:9px;margin-bottom:14px;color:#3949a5}
.registry-overview-block__heading h5{margin:0;color:#273164;font-size:14px;font-weight:800}
.registry-overview-count{margin-left:auto;font-size:11px;color:#697795;background:#f1f4fb;border-radius:9px;padding:5px 9px}
.registry-overview-list{border:0;border-radius:0;overflow:visible}
.registry-overview-list__row{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;padding:12px 0;border-bottom:1px solid #edf0f6}
.registry-overview-list__row:last-child{border-bottom:0}
.registry-overview-list__main{min-width:0;display:flex;flex-direction:column;gap:4px;overflow-wrap:anywhere}
.registry-overview-list__main strong{font-size:13px;color:#273164}
.registry-overview-list__main span,.registry-overview-list__meta{font-size:12px;color:#667490;overflow-wrap:anywhere}
.registry-overview-list__meta{flex:none}
.registry-overview-empty{padding:10px 0;border:0;border-radius:0;font-size:12px;color:#78849d}
@media(max-width:620px){.registry-overview-list__row{align-items:flex-start;flex-direction:column}.registry-overview-list__meta{flex:auto}}

</style>

<style scoped>
.registry-assign-panel{border:1px solid #dfe4f1;border-radius:13px;overflow:hidden;background:#fff}
.registry-assign-panel__head{display:flex;justify-content:space-between;gap:12px;align-items:start;padding:16px;background:#f7f8fe}
.registry-assign-panel__head strong{color:#242766;font-size:15px}
.registry-assign-panel__head p{font-size:12px;color:#687797;margin:5px 0 0}
.registry-assign-controls{display:flex;align-items:center;gap:12px;padding:13px 16px;border-top:1px solid #e9edf5;border-bottom:1px solid #e9edf5}
.registry-assign-type{flex:1 1 260px;min-width:0}
.registry-department-groups{padding:12px;display:flex;flex-direction:column;gap:12px;max-height:340px;overflow-y:auto}
.registry-department-group{border:1px solid #e6eaf5;border-radius:10px;overflow:hidden}
.registry-department-group__header{display:flex;align-items:center;justify-content:space-between;background:#f5f7fc;padding:9px 13px;gap:10px}
.registry-department-group__header strong{display:block;font-size:13px;color:#303477}
.registry-department-group__header span{font-size:11px;color:#7a859b}
.registry-department-group__empty{padding:14px;color:#7a859b;font-size:12px}
.registry-assigned-groups{display:flex;flex-direction:column;gap:10px}
.registry-assigned-group{border:1px solid #dfe4f1;border-radius:11px;overflow:hidden}
.registry-assigned-group__header{background:#eef0ff;padding:9px 14px;display:flex;align-items:center;gap:9px;justify-content:space-between;color:#282d83}
.registry-assigned-user{padding:7px 13px;display:flex;gap:10px;align-items:center;border-top:1px solid #eef0f7;font-size:12px;color:#37466b}
.registry-assigned-user span{flex:1;min-width:0;overflow-wrap:anywhere}
@media(max-width:620px){.registry-assign-controls{flex-wrap:wrap}.registry-assign-controls>.q-btn{width:100%}}
</style>

<style scoped>
.registry-stakeholder-section{border:1px solid #dde4f4;border-radius:12px;padding:12px;background:#fff}
.registry-stakeholder-section__title{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px}
.registry-stakeholder-section__title strong{font-size:15px;color:#222764}
.registry-stakeholder-section .registry-stakeholder-list{max-height:280px;overflow-y:auto}
</style>

<style scoped lang="scss">
/* Spacious, responsive Registry editor */
.registry-dialog--editor{width:min(1280px,97vw)!important;max-width:1280px!important;height:min(900px,94vh);max-height:94vh;display:flex;flex-direction:column;overflow:hidden;border-radius:22px;box-shadow:0 28px 90px rgba(27,35,90,.22)}
.registry-dialog--editor .registry-wizard-header{flex-shrink:0;padding:22px 30px;background:linear-gradient(118deg,#f0f2ff 0%,#fff 72%);border-bottom:1px solid #e7eaf7}
.registry-wizard-header__aside{display:flex;align-items:center;gap:12px;flex-shrink:0}
.registry-wizard-counter{color:#4046a0;background:#e9ebff;padding:8px 13px;font-size:12px;font-weight:800;border-radius:99px;white-space:nowrap}
.registry-wizard-progress{height:4px;background:#eef0fa;flex-shrink:0;overflow:hidden}
.registry-wizard-progress__fill{height:100%;background:linear-gradient(90deg,#4548bc,#7b6ee4);border-radius:0 4px 4px 0;transition:width .25s ease}
.registry-wizard-form{display:flex;flex-direction:column;flex:1;min-height:0}
.registry-wizard-layout{display:grid;grid-template-columns:250px minmax(0,1fr);flex:1;min-height:0}
.registry-wizard-sidebar{display:flex;flex-direction:column;gap:16px;background:#f7f8fd;border-right:1px solid #e7eaf5;padding:26px 16px 20px;min-height:0;overflow:auto}
.registry-sidebar-title{padding:0 12px;color:#8993b0;letter-spacing:.12em;font-weight:850;font-size:10px}
.registry-dialog--editor .registry-wizard-steps{display:flex;flex-direction:column;gap:7px;margin:0}
.registry-dialog--editor .registry-wizard-step{width:100%;min-height:53px;border-radius:12px;padding:11px 12px;background:transparent;border:1px solid transparent;color:#626f8c;font-weight:700;font-size:13px;gap:11px}
.registry-dialog--editor .registry-wizard-step:hover:not(:disabled){background:#eceeff;border-color:#dcdff7;transform:translateX(2px)}
.registry-dialog--editor .registry-wizard-step.is-current{background:#e8eaff;border-color:#bfc4f6;color:#34359d;box-shadow:0 3px 12px rgba(63,70,158,.08)}
.registry-dialog--editor .registry-wizard-step.is-complete{background:#f0f7f6;color:#347266;border-color:transparent}
.registry-sidebar-hint{margin-top:auto;display:flex;align-items:flex-start;gap:10px;background:#fff;border:1px solid #e7eafa;color:#7d89a3;padding:13px;border-radius:13px;font-size:11px;line-height:1.5}
.registry-sidebar-hint .q-icon{color:#7476c6;flex:none}
.registry-dialog--editor .registry-wizard-main{padding:26px clamp(22px,3.1vw,48px) 40px;max-height:none;min-height:0;overflow-y:auto;overscroll-behavior:contain;gap:16px;background:#fff}
.registry-wizard-section-meta{display:flex;justify-content:space-between;align-items:center;font-size:11px;letter-spacing:.06em;font-weight:850;text-transform:uppercase;color:#808ba6}
.registry-wizard-section-meta span:last-child{letter-spacing:0;background:#f0f1fa;color:#565ba9;padding:6px 10px;border-radius:8px}
.registry-dialog--editor .registry-wizard-content{gap:19px;min-height:270px}
.registry-dialog--editor .registry-form__grid{gap:16px}
/* System Profile: evenly spaced controls without Quasar's unused validation-footer height. */
.registry-dialog--editor .registry-profile-fields{gap:18px}
.registry-dialog--editor .registry-profile-fields__row{gap:18px;align-items:start}
.registry-dialog--editor .registry-profile-fields > .q-field,
.registry-dialog--editor .registry-profile-fields__row > .q-field{min-width:0;width:100%}

.registry-wizard-footer{background:white;flex-shrink:0;min-height:77px;gap:12px;padding:14px 25px!important}
.registry-wizard-footer .q-btn{border-radius:10px;min-height:42px;padding-left:17px;padding-right:17px}
@media(max-width:900px){.registry-wizard-layout{grid-template-columns:1fr;grid-template-rows:auto minmax(0,1fr)}.registry-wizard-sidebar{padding:12px 16px;overflow:visible;gap:6px}.registry-sidebar-title,.registry-sidebar-hint{display:none}.registry-dialog--editor .registry-wizard-steps{display:flex;flex-direction:row;overflow-x:auto;gap:7px;padding:3px 1px 6px}.registry-dialog--editor .registry-wizard-step{width:auto;white-space:nowrap;flex:none;min-height:44px;padding:8px 10px}.registry-wizard-step__number{width:26px;height:26px}.registry-dialog--editor .registry-wizard-main{padding:22px}.registry-dialog--editor .registry-wizard-header{padding:16px 20px}}
@media(max-width:600px){.registry-dialog--editor{width:100vw!important;max-width:100vw!important;height:100dvh;max-height:100dvh;border-radius:0}.registry-wizard-counter{display:none}.registry-wizard-header__copy .text-caption{display:none}.registry-dialog--editor .registry-wizard-header{gap:10px;padding:14px}.registry-dialog--editor .registry-wizard-main{padding:16px}.registry-dialog--editor .registry-form__grid{grid-template-columns:1fr}.registry-wizard-footer{flex-wrap:wrap;padding:10px!important;gap:5px;min-height:66px}.registry-wizard-footer .q-btn{padding:0 10px}.registry-footer-current{display:none}.registry-dialog--editor .registry-wizard-intro{padding:14px}.registry-dialog--editor .registry-wizard-intro > .q-icon{padding:7px}}
</style>

<style scoped>
.registry-choice-dialog{width:min(590px,94vw);max-width:590px;border-radius:18px}
.registry-choice-options{display:grid;gap:13px;padding:8px 22px 24px}
.registry-choice-option{display:flex;align-items:center;text-align:left;gap:15px;width:100%;padding:20px;border:1px solid #e3e7fa;border-radius:14px;background:#fafbff;color:#30386e;cursor:pointer;transition:background .18s,border-color .18s,transform .18s}
.registry-choice-option:hover,.registry-choice-option:focus-visible{background:#eff1ff;border-color:#898fe5;transform:translateY(-1px)}
.registry-choice-option span{display:grid;flex:1;gap:5px}
.registry-choice-option strong{font-size:15px}
.registry-choice-option small{color:#72809c;font-size:12px}
.registry-existing-dialog{width:min(740px,96vw);max-width:740px;border-radius:18px}
.registry-existing-results{max-height:min(440px,50vh);overflow-y:auto;padding-top:0}
</style>

<style scoped>
.registry-documents{display:flex;flex-direction:column;gap:16px}
.registry-documents-empty{display:flex;gap:10px;align-items:center;padding:22px;border:1px dashed #cfd6ec;border-radius:12px;background:#f8f9fe;color:#65708e}
.registry-document-assign-dialog{width:min(520px,94vw);border-radius:16px}
</style>

<style scoped>
/* System Profile registration dialog – redesigned presentation only. */
.registry-profile-init-dialog{width:min(860px,95vw);max-width:860px;border-radius:20px;overflow:hidden;background:#f7f9fd;color:#192d56}
.registry-profile-init-header{display:flex;align-items:center;gap:16px;padding:24px 28px;background:linear-gradient(115deg,#092c73 0%,#0038a8 68%,#285fbe 100%);color:white}
.registry-profile-init-icon{display:grid;place-items:center;flex:0 0 52px;height:52px;border-radius:15px;background:rgba(255,255,255,.15);color:white;border:1px solid rgba(255,255,255,.21)}
.registry-profile-init-heading{min-width:0;flex:1}
.registry-profile-init-eyebrow{font-size:10px;font-weight:800;letter-spacing:.15em;color:#c5d8ff;margin-bottom:5px}
.registry-profile-init-heading h2{font-size:21px;font-weight:800;line-height:1.25;margin:0;color:white}
.registry-profile-init-heading p{margin:6px 0 0;font-size:12px;color:#deebff;line-height:1.45}
.registry-profile-init-close{color:white;align-self:flex-start;margin:-5px -8px 0 0}
.registry-profile-init-fields{display:flex;flex-direction:column;gap:16px;padding:20px 24px 24px;max-height:calc(90vh - 177px);overflow-y:auto}
.registry-profile-init-panel{background:#fff;border:1px solid #e0e8f4;border-radius:15px;padding:22px 22px 24px;box-shadow:0 4px 16px rgba(18,49,105,.035)}
.registry-profile-init-section-heading{display:flex;align-items:center;gap:12px;margin-bottom:19px}
.registry-profile-init-section-heading h3{font-size:15px;line-height:1.35;margin:0;font-weight:800;color:#142f69}
.registry-profile-init-section-heading p{font-size:12px;line-height:1.4;margin:3px 0 0;color:#687b9c}
.registry-profile-init-required-hint{font-size:11px;color:#7b89a5;margin-left:auto;white-space:nowrap;align-self:flex-start}
.registry-profile-init-inputs{display:flex;flex-direction:column;gap:14px}
.registry-profile-init-inputs :deep(.q-field--outlined .q-field__control){border-radius:9px}
.registry-profile-init-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.registry-profile-init-description :deep(textarea){min-height:50px!important}
.registry-profile-init-panel--architecture{padding-bottom:22px}
.registry-profile-init-solution-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}
.registry-profile-init-solution{appearance:none;position:relative;min-height:100px;min-width:0;border:1.5px solid #dbe5f4;border-radius:12px;background:#fbfcff;color:#2b477c;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:10px;padding:14px 12px;cursor:pointer;text-align:left;transition:background .18s,border-color .18s,box-shadow .18s,transform .18s;font:inherit}
.registry-profile-init-solution:hover{border-color:#82a6eb;background:#f3f7ff;transform:translateY(-1px)}
.registry-profile-init-solution:focus-visible{outline:3px solid #93b9fb;outline-offset:2px}
.registry-profile-init-solution.is-selected{background:#edf4ff;border-color:#0038a8;box-shadow:0 0 0 1px #0038a8 inset}
.registry-profile-init-solution-icon{display:grid;place-items:center;width:36px;height:36px;border-radius:10px;background:#edf2fb;color:#315896}
.registry-profile-init-solution.is-selected .registry-profile-init-solution-icon{background:#0038a8;color:#fff}
.registry-profile-init-solution-name{font-size:11px;line-height:1.35;letter-spacing:.025em;font-weight:800;overflow-wrap:anywhere}
.registry-profile-init-footer{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:14px 24px;background:white}
.registry-profile-init-footer-note{display:flex;align-items:center;gap:7px;color:#71809b;font-size:11px;line-height:1.4;max-width:330px}
.registry-profile-init-footer-actions{display:flex;gap:8px;align-items:center;margin-left:auto}
.registry-profile-init-submit{border-radius:9px;padding:0 14px;min-height:41px;background:#0038a8!important;font-weight:700}
@media(max-width:760px){.registry-profile-init-solution-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.registry-profile-init-footer-note{display:none}}
@media(max-width:600px){.registry-profile-init-dialog{width:100vw;max-width:100vw;border-radius:0}.registry-profile-init-grid{grid-template-columns:1fr}.registry-profile-init-fields{padding:14px;gap:12px}.registry-profile-init-header{padding:17px}.registry-profile-init-panel{padding:16px}.registry-profile-init-solution-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.registry-profile-init-solution{min-height:82px}.registry-profile-init-footer{padding:12px 16px}.registry-profile-init-heading h2{font-size:17px}.registry-profile-init-icon{height:43px;flex-basis:43px}}
</style>

<style scoped lang="scss">
/* 2026 registry visual system: presentation only; existing state and APIs unchanged */
.registry-page.workspace-page {
  width:100%; max-width:1560px; padding:36px clamp(18px,3.3vw,56px) 64px;
  color:#18244e;
}
.registry-heading {
  display:flex; align-items:center; justify-content:space-between; gap:24px;
  padding:0 0 28px; margin-bottom:22px;
}
.registry-heading__main { display:flex; align-items:center; min-width:0; gap:18px; }
.registry-heading__icon {
  width:58px; height:58px; flex:0 0 58px; display:grid;place-items:center;
  color:#4338ca; background:linear-gradient(145deg,#e9eaff,#f2f5ff);
  border:1px solid #e1e5fa; border-radius:18px;
  box-shadow:0 7px 20px rgba(70,68,173,.06);
}
.registry-heading__copy { min-width:0; }
.registry-heading .section-kicker { font-size:10px; letter-spacing:.12em; font-weight:800; color:#6068a8; }
.registry-heading__crumb { color:#b4bcce; margin:0 5px; }
.registry-heading h1 {
  font-size:clamp(27px,2.6vw,39px); line-height:1.17;
  letter-spacing:-.042em; font-weight:800; margin:7px 0 5px; color:#192452;
}
.registry-heading p { margin:0; color:#7c8aa5; font-size:13px; line-height:1.55; }
.registry-heading__right { display:flex;gap:16px;align-items:center;flex:none; }
.registry-live-indicator {
  display:inline-flex;align-items:center;gap:8px;white-space:nowrap;
  font-size:11px;font-weight:700;color:#427c68;
  padding:8px 11px;background:#eff9f4;border:1px solid #daf0e5;border-radius:99px;
}
.registry-live-indicator__dot {height:7px;width:7px;border-radius:50%;background:#24b47e;box-shadow:0 0 0 3px #dcf5e9;}
.registry-heading .registry-add {
  min-height:43px; height:43px; border-radius:12px; font-size:12px;
  padding:0 19px; font-weight:750;
  background:linear-gradient(110deg,#3733a7,#5149c9);
  box-shadow:0 7px 17px rgba(56,55,173,.17);
}
.registry-stats {gap:15px;margin-bottom:23px;}
.registry-stat {
  position:relative; overflow:hidden; min-height:137px; padding:19px 19px 17px;
  border-radius:16px; border-color:#e4e9f2;
  box-shadow:0 7px 24px rgba(27,39,87,.035);
  transition:transform .18s ease, box-shadow .18s ease, border-color .18s ease;
}
.registry-stat:hover {transform:translateY(-2px);border-color:#cfd5f0;box-shadow:0 11px 30px rgba(27,39,87,.065);}
.registry-stat__top {letter-spacing:.065em;font-size:10px;color:#7481a0;}
.registry-stat__top > .q-icon {opacity:.5;font-size:17px!important;}
.registry-stat__body {gap:15px;margin-top:14px;}
.registry-stat__icon {height:51px;width:51px;border-radius:14px;}
.registry-stat__icon .q-icon {font-size:25px!important;}
.registry-stat strong {font-size:33px;font-weight:800;}
.registry-stat p {font-size:11px;color:#8792a9;}
.registry-stat--total .registry-stat__icon{background:#edefff;color:#4842ba;}
.registry-stat--active .registry-stat__icon{background:#e8f9f1;color:#079765;}
.registry-stat--review .registry-stat__icon{background:#fff6e8;color:#c78524;}
.registry-stat--archived .registry-stat__icon{background:#fff0f1;color:#cb4c5f;}
.registry-panel {padding:0;overflow:hidden;border:1px solid #e2e7f1;border-radius:18px;box-shadow:0 12px 32px rgba(34,45,88,.035);}
.registry-panel__heading {
  padding:24px 26px 19px; margin:0; align-items:flex-end;gap:22px;
  background:#fff;border-bottom:1px solid #edf0f6;
}
.registry-panel__eyebrow {font-size:10px;letter-spacing:.12em;color:#777fb0;font-weight:800;}
.registry-panel__heading h2 {font-size:21px;margin:4px 0 3px;letter-spacing:-.025em;}
.registry-panel__heading p {font-size:12px;color:#8a96aa;}
.registry-actions {gap:10px;flex-wrap:wrap;justify-content:flex-end;}
.registry-search {width:260px;max-width:34vw;}
.registry-status-filter {min-width:156px;width:156px;}
.registry-refresh {background:#f5f6fc;color:#46518e;}
.registry-actions :deep(.q-field__control) {border-radius:11px;min-height:41px;height:41px;}
.registry-actions :deep(.q-field--dense .q-field__marginal) {height:41px;}
.registry-table :deep(thead tr) {background:#f7f8fc;}
.registry-table :deep(th) {
  font-size:10px; letter-spacing:.075em; padding:17px 21px;
  color:#6f7c9d; border-bottom:1px solid #e9edf5;
}
.registry-table :deep(td) {padding:15px 21px;border-color:#f0f2f8;font-size:12px;}
.registry-table :deep(tbody tr) {transition:background-color .16s ease;}
.registry-table :deep(tbody tr:hover) {background:#f9faff;}
.registry-system-icon {height:42px;width:42px;border-radius:12px!important;}
.registry-system-cell {gap:13px;}
.registry-system-cell strong {font-size:13px;font-weight:750;color:#202a59;}
.registry-system-cell small {margin-top:4px;color:#8c97b1;}
.registry-pill--status {padding:7px 11px;border-radius:99px;font-weight:750;}
.registry-pill__dot {height:6px;width:6px;}
.registry-table :deep(.q-table__bottom) {padding:14px 22px;border-top:1px solid #edf0f6;color:#73809c;}
/* Align the new-system entry and the six-step editor with the same design language. */
.registry-choice-dialog,.registry-existing-dialog,.registry-profile-init-dialog {box-shadow:0 25px 80px rgba(25,36,86,.16);}
.registry-choice-option {border-radius:16px;background:#fff;}
.registry-choice-option:hover {background:#f6f6ff;}
.registry-dialog--editor {border-radius:20px;}
.registry-dialog--editor .registry-wizard-header {padding:18px 26px;background:#fff;}
.registry-dialog--editor .registry-wizard-header__icon {border-radius:13px;}
.registry-dialog--editor .registry-wizard-sidebar {background:#f8f9fe;border-right:1px solid #ebedf7;}
.registry-dialog--editor .registry-wizard-step {border-radius:11px;}
.registry-dialog--editor .registry-wizard-main {background:#fff;}
.registry-dialog--editor .registry-wizard-footer {border-top:1px solid #edf0f8;}
.registry-dialog--editor .registry-wizard-footer .q-btn {border-radius:11px;}
@media(max-width:1100px) {
  .registry-heading__right {gap:9px;}
  .registry-live-indicator {display:none;}
  .registry-panel__heading {flex-direction:column;align-items:stretch;}
  .registry-actions {justify-content:flex-start;}
  .registry-search {width:min(390px,100%);max-width:none;}
}
@media(max-width:700px) {
  .registry-page.workspace-page {padding:20px 14px 45px;}
  .registry-heading {align-items:flex-start;gap:13px;}
  .registry-heading__main {gap:11px;}
  .registry-heading__icon {width:43px;height:43px;flex-basis:43px;border-radius:12px;}
  .registry-heading h1 {font-size:24px;}
  .registry-heading p {font-size:11px;}
  .registry-heading__right .registry-add {min-width:44px;padding:0 10px;}
  .registry-stats {grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;}
  .registry-stat {min-height:118px;padding:13px;}
  .registry-stat__body {gap:10px;margin-top:12px;}
  .registry-stat__icon {width:40px;height:40px;border-radius:11px;}
  .registry-stat strong {font-size:26px;}
  .registry-panel__heading {padding:18px 15px;}
  .registry-actions {width:100%;gap:8px;}
  .registry-search {flex:1 1 100%;}
  .registry-status-filter {flex:1 1 150px;min-width:0;}
  .registry-table :deep(th),.registry-table :deep(td) {padding-left:12px;padding-right:12px;}
}
</style>

<style scoped lang="scss">
/* DSWD ONE ICTMS refresh, scoped to Registry page and its existing dialog */
.registry-page.workspace-page {
  --registry-navy:#092c7a;--registry-blue:#0038a8;--registry-red:#ce1126;--registry-gold:#f5c342;
  --registry-soft:#f3f7ff;--registry-outline:#dbe4f4;
  max-width:1680px;padding-top:23px;color:#102a5c;
}
.registry-heading {
  position:relative;overflow:hidden;isolation:isolate;align-items:center;
  border:1px solid #d7e3f6;border-radius:16px;padding:22px 25px;
  background:linear-gradient(112deg,#fff 0%,#f1f6ff 52%,#dceaff 100%);
  box-shadow:0 8px 25px rgba(20,59,131,.045);margin-bottom:17px;
}
.registry-heading::before {
  content:'';position:absolute;inset:auto -8% -130px 43%;height:198px;z-index:-1;
  border-radius:50%;background:rgba(52,114,215,.08);transform:rotate(-12deg);
}

.registry-heading__icon {width:56px;height:56px;flex-basis:56px;border-radius:13px;
  background:#fff;border:1px solid #d7e2f6;color:#0038a8;
  box-shadow:0 4px 12px rgba(0,56,168,.08);
}
.registry-heading .section-kicker {color:#0038a8;letter-spacing:.09em;font-size:10px}
.registry-heading h1 {font-size:clamp(25px,2.35vw,34px);margin:4px 0;color:#091e57;letter-spacing:-.035em}
.registry-heading p{font-size:12px;max-width:640px;color:#51678e}
.registry-heading__right{position:relative;z-index:1;align-self:flex-end}
.registry-heading .registry-add{background:#0038a8;border-radius:9px;box-shadow:0 6px 16px rgba(0,56,168,.19)}
.registry-heading .registry-add:hover{background:#002c87}
.registry-stats {grid-template-columns:repeat(5,minmax(0,1fr));gap:11px;margin-bottom:18px}
.registry-stat {min-height:107px;border-radius:12px;padding:15px 15px 13px;border:1px solid #dce5f4;
  border-left:4px solid #0038a8;box-shadow:0 5px 16px rgba(15,49,117,.04)}
.registry-stat__top {color:#526386;font-size:10px;letter-spacing:0;font-weight:800}
.registry-stat__top > .q-icon{display:none}
.registry-stat__body{margin-top:11px;gap:10px}
.registry-stat__icon{width:42px;height:42px;border-radius:11px;background:#e7efff;color:#0038a8}
.registry-stat__icon .q-icon{font-size:22px!important}
.registry-stat strong{font-size:28px;color:#09285f}
.registry-stat p{font-size:10px;margin-top:3px}
.registry-stat--active{border-left-color:#16995d}
.registry-stat--review{border-left-color:#ec8f23}
.registry-stat--development{border-left-color:#2587df}
.registry-stat--development .registry-stat__icon{background:#e5f4ff;color:#1075c7}
.registry-stat--archived{border-left-color:#6b7b9a}
.registry-stat--archived .registry-stat__icon{background:#eff2f7;color:#637491}
.registry-panel{border-color:#dbe5f5;border-radius:13px;box-shadow:0 7px 25px rgba(20,47,104,.045)}
.registry-panel__heading{padding:18px 20px;border-bottom:2px solid #edf1f8;align-items:center}
.registry-panel__eyebrow {color:#0038a8}
.registry-panel__heading h2{font-size:18px;color:#09265e}
.registry-panel__count{font-size:14px;color:#6b7d9f;font-weight:650}
.registry-panel__heading p{font-size:11px}
.registry-actions :deep(.q-field__control){border-radius:8px;background:#fff}
.registry-actions :deep(.q-field--outlined .q-field__control:before){border-color:#ccd9ef}
.registry-refresh{background:#edf3ff;color:#0038a8}
.registry-table :deep(thead tr){background:#eff4fd}
.registry-table :deep(th){color:#1a3a7c;letter-spacing:.03em;font-size:10px}
.registry-table :deep(td){padding-top:11px;padding-bottom:11px;color:#283f70}
.registry-table :deep(tbody tr:hover){background:#f2f7ff}
.registry-system-icon{background:#0038a8!important;border-radius:9px!important}
.registry-system-cell strong{color:#0f2d6c}
.registry-pill--status{border-radius:30px}
.registry-pill--status.is-development{background:#e7efff;color:#1449be}
.registry-pill--status.is-review{background:#fff2e2;color:#b45b00}
.registry-pill--status.is-archived{background:#edf0f5;color:#53617b}
.registry-dialog--editor{border-radius:20px;box-shadow:0 30px 90px rgba(8,31,83,.21)}
.registry-dialog--editor .registry-wizard-header{position:relative;overflow:hidden;background:linear-gradient(115deg,#fff,#f2f6ff);border-bottom:1px solid #dfE7f5;padding:20px 26px}
.registry-dialog--editor .registry-wizard-header::after{content:'';position:absolute;top:-26px;right:64px;width:150px;height:53px;transform:rotate(-17deg);background:linear-gradient(#f4cc34 0 28%,#ce1126 28% 56%,#0038a8 56% 84%,transparent 84%);border-radius:0 0 0 60%;opacity:.8;pointer-events:none}
.registry-dialog--editor .registry-wizard-header__icon{background:#e9f0ff;color:#0038a8;border:1px solid #dce7fa}
.registry-dialog--editor .registry-wizard-header__eyebrow{color:#0038a8}
.registry-dialog--editor .registry-wizard-header__copy .text-h6{color:#102b64;font-weight:800}
.registry-wizard-progress__fill{background:#0038a8}
.registry-dialog--editor .registry-wizard-sidebar{background:#f7f9fe;border-right:1px solid #e0e8f5}
.registry-dialog--editor .registry-wizard-step{color:#48618e;min-height:48px;border-radius:9px}
.registry-dialog--editor .registry-wizard-step.is-current{background:#0038a8;border-color:#0038a8;color:#fff;box-shadow:0 5px 11px rgba(0,56,168,.17)}
.registry-dialog--editor .registry-wizard-step.is-current::before{background:#ce1126;top:8px;bottom:8px}
.registry-dialog--editor .registry-wizard-step.is-current .registry-wizard-step__arrow{color:#fff}
.registry-dialog--editor .registry-wizard-step:hover:not(:disabled):not(.is-current){background:#ebf2ff;color:#0038a8}
.registry-dialog--editor .registry-wizard-main{background:#fdfefe}
.registry-dialog--editor .registry-wizard-footer{background:#fff;border-top:1px solid #e3eaf7}
.registry-dialog--editor .registry-wizard-footer .q-btn--unelevated{background:#0038a8!important}
.registry-overview-block,.registry-overview-block:first-of-type{border:1px solid #dce6f7;border-radius:13px;background:#fff;box-shadow:0 3px 10px rgba(14,45,108,.025);padding:20px;margin:0}
.registry-overview-block:first-of-type{padding-top:20px}
.registry-overview-block__heading{margin-bottom:17px;gap:10px}
.registry-overview-block__heading h5{font-size:14px;color:#0c2b70}
.registry-overview-heading-icon{width:32px;height:32px;display:grid;place-items:center;border-radius:9px;background:#eaf1ff;color:#0038a8}
.registry-details-readonly__item dt{color:#657da7;font-size:11px}
.registry-details-readonly__item dd{color:#0c285f}
.registry-details-readonly__status{border-radius:8px}
.registry-overview-list__row{border-color:#e5ebf7}
@media(max-width:1250px){.registry-stats{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:800px){.registry-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.registry-heading{padding:18px}.registry-heading__right{align-self:center}.registry-panel__heading{flex-direction:column;align-items:stretch}}
@media(max-width:560px){.registry-stats{gap:9px}.registry-stat{padding:12px;min-height:100px}.registry-stat strong{font-size:25px}.registry-heading{align-items:flex-start;flex-direction:column}.registry-heading__right{align-self:flex-start}.registry-heading__icon{width:46px;height:46px;flex-basis:46px}.registry-panel__heading{padding:16px}.registry-dialog--editor .registry-wizard-header::after{display:none}}
</style>

<style scoped>
/* Modern Registry modal inspired by the supplied reference, aligned to DSWD blue. */
.registry-dialog--editor{width:min(1340px,96vw)!important;max-width:1340px!important;border-radius:24px!important;box-shadow:0 35px 95px rgba(12,34,90,.27)!important}
.registry-dialog--editor .registry-wizard-header{position:relative;isolation:isolate;min-height:126px;padding:24px 30px!important;background:linear-gradient(114deg,#ffffff 0%,#f6f9ff 54%,#eaf1ff 100%)!important;border-bottom:1px solid #dee7fa!important;gap:18px}
.registry-dialog--editor .registry-wizard-header::before{content:'';position:absolute;right:58px;bottom:-70px;width:345px;height:165px;background:linear-gradient(130deg,rgba(0,56,168,.04),rgba(65,108,227,.13));transform:rotate(-22deg);border-radius:50%;z-index:-1;pointer-events:none}
.registry-dialog--editor .registry-wizard-header::after{top:0!important;right:0!important;width:145px!important;height:7px!important;transform:none!important;border-radius:0 24px 0 10px!important;background:linear-gradient(90deg,#ffcf35 0% 34%,#ce1126 34% 65%,#0038a8 65%)!important;opacity:1!important}
.registry-dialog--editor .registry-wizard-header__icon{width:64px;height:64px;border-radius:18px!important;display:grid;place-items:center;background:linear-gradient(145deg,#edf3ff,#dce7ff)!important;color:#0038a8!important;flex:none}
.registry-dialog--editor .registry-wizard-header__copy{position:relative;z-index:1;min-width:0}
.registry-dialog--editor .registry-wizard-header__eyebrow{font-size:11px;letter-spacing:.12em;font-weight:850!important;color:#0038a8!important}
.registry-dialog--editor .registry-wizard-header__copy .text-h6{font-size:24px!important;font-weight:850!important;line-height:1.25;margin:5px 0;color:#10275d!important}
.registry-dialog--editor .registry-wizard-header__subtitle{color:#5b6e98;max-width:640px;margin:3px 0 0;font-size:13px}
.registry-wizard-header__art{position:relative;flex:none;width:115px;height:73px;margin-left:auto;margin-right:4px;display:flex;align-items:center;justify-content:center}
.registry-wizard-header__art-screen{width:93px;height:59px;border:4px solid #fff;border-radius:13px;background:linear-gradient(130deg,#0038a8,#4a73d8);color:#fff;display:grid;place-items:center;box-shadow:0 9px 23px rgba(0,56,168,.24);transform:rotate(5deg)}
.registry-wizard-header__art-gear{position:absolute;right:-4px;bottom:-2px;display:grid;place-items:center;width:38px;height:38px;border-radius:50%;background:#fff;color:#0038a8;box-shadow:0 4px 14px rgba(0,56,168,.19)}
.registry-dialog--editor .registry-wizard-header__aside{align-self:flex-start;z-index:2;margin-left:6px}
.registry-dialog--editor .registry-wizard-header__aside .q-btn{background:#fff;color:#223f77;box-shadow:0 3px 11px rgba(18,55,127,.1)}
.registry-dialog--editor .registry-wizard-layout{grid-template-columns:266px minmax(0,1fr)}
.registry-dialog--editor .registry-wizard-sidebar{background:linear-gradient(180deg,#f6f8ff,#fbfcff)!important;border-right:1px solid #e1e8fa!important;padding:27px 18px!important}
.registry-dialog--editor .registry-wizard-steps{gap:8px!important}
.registry-dialog--editor .registry-wizard-step{display:flex!important;align-items:center;justify-content:flex-start;text-align:left;gap:13px!important;font-size:14px!important;font-weight:750!important;padding:14px 15px!important;min-height:52px!important;border-radius:12px!important}
.registry-dialog--editor .registry-wizard-step__icon{flex:none;opacity:.9}
.registry-dialog--editor .registry-wizard-step__arrow{margin-left:auto}
.registry-dialog--editor .registry-wizard-step.is-current{background:linear-gradient(110deg,#0038a8,#2557cd)!important;border:1px solid #0038a8!important;color:#fff!important;box-shadow:0 8px 18px rgba(0,56,168,.19)!important}
.registry-dialog--editor .registry-wizard-step.is-complete:not(.is-current){background:transparent!important;color:#42577c!important}
.registry-dialog--editor .registry-wizard-main{background:#fbfcff!important;padding:26px clamp(20px,2.3vw,40px) 38px!important}
.registry-dialog--editor .registry-details-view{gap:18px!important}
.registry-dialog--editor .registry-overview-block{background:#fff;border:1px solid #dce5f8;border-radius:17px;box-shadow:0 4px 14px rgba(15,48,116,.035);padding:22px!important}
.registry-dialog--editor .registry-overview-block--profile{padding:0!important;overflow:hidden}
.registry-profile-summary{display:flex;align-items:center;gap:18px;min-height:115px;padding:22px 28px;background:linear-gradient(110deg,#f3f7ff,#e8efff);position:relative;flex-wrap:wrap}
.registry-profile-summary__icon{width:60px;height:60px;background:#fff;color:#0038a8;display:grid;place-items:center;border-radius:16px;border:1px solid #d8e3ff;box-shadow:0 6px 14px rgba(0,56,168,.09);flex:none}
.registry-profile-summary__copy{min-width:0;flex:1;border-left:2px solid #b6c9fc;padding-left:18px}
.registry-profile-summary__kicker{display:block;font-size:11px;letter-spacing:.1em;font-weight:800;color:#0038a8}
.registry-profile-summary__copy h3{margin:5px 0 0;font-size:27px;font-weight:850;line-height:1.2;color:#0e2d72;overflow-wrap:anywhere}
.registry-profile-summary__status{display:inline-flex;align-items:center;gap:7px;max-width:100%;padding:9px 14px;border-radius:100px;background:#e4f6ed;color:#137a4d;font-weight:800;font-size:13px;white-space:nowrap}
.registry-profile-summary__status.is-review{background:#fff2df;color:#b56a04}
.registry-profile-summary__status.is-archived{background:#eef0f5;color:#657087}
.registry-profile-summary__dot{width:8px;height:8px;border-radius:50%;background:currentColor}
.registry-profile-summary__details{margin:0;display:grid;grid-template-columns:1fr 1fr;gap:0;padding:22px 28px 24px}
.registry-profile-summary__detail{display:flex;align-items:flex-start;gap:13px;min-width:0}
.registry-profile-summary__detail+ .registry-profile-summary__detail{border-left:1px solid #dfe7f7;padding-left:24px}
.registry-profile-summary__detail-icon{width:34px;height:34px;background:#eff4ff;color:#0038a8;display:grid;place-items:center;border-radius:10px;flex:none}
.registry-profile-summary__detail dt{color:#6075a2;font-size:12px;font-weight:750;margin-bottom:6px}
.registry-profile-summary__detail dd{margin:0;color:#142e65;font-size:14px;line-height:1.5;font-weight:650;overflow-wrap:anywhere}
.registry-dialog--editor .registry-overview-block__heading{margin:0 0 16px;gap:12px}
.registry-dialog--editor .registry-overview-block__heading h5{font-size:17px;font-weight:850;color:#0e2d72}
.registry-dialog--editor .registry-overview-heading-icon{width:40px;height:40px;border-radius:12px;background:#e9f0ff;color:#0038a8}
.registry-dialog--editor .registry-details-section__fields{gap:12px 20px}
.registry-dialog--editor .registry-details-readonly__item:not(.registry-details-readonly__item--wide){padding:13px 15px;background:#f6f8ff;border-radius:11px;min-height:67px}
.registry-dialog--editor .registry-details-readonly__item--wide{padding:13px 15px;background:#f6f8ff;border-radius:11px}
.registry-dialog--editor .registry-details-readonly__item dt{font-size:12px;font-weight:750;color:#5b70a0;margin:0 0 7px}
.registry-dialog--editor .registry-details-readonly__item dd{font-size:14px;font-weight:750;color:#1b356d;line-height:1.4;margin:0}
.registry-dialog--editor .registry-wizard-footer{min-height:70px;background:white!important;padding:12px 26px!important}
.registry-dialog--editor .registry-wizard-footer .q-btn--unelevated{border-radius:11px!important;min-width:106px}
@media(max-width:1000px){.registry-dialog--editor .registry-wizard-layout{grid-template-columns:215px minmax(0,1fr)}.registry-dialog--editor .registry-wizard-sidebar{padding:20px 10px!important}.registry-dialog--editor .registry-wizard-main{padding:20px!important}.registry-wizard-header__art{display:none}}
@media(max-width:900px){.registry-dialog--editor .registry-wizard-layout{grid-template-columns:1fr;grid-template-rows:auto minmax(0,1fr)}.registry-dialog--editor .registry-wizard-sidebar{padding:10px 12px!important}.registry-dialog--editor .registry-wizard-steps{flex-direction:row!important;overflow-x:auto}.registry-dialog--editor .registry-wizard-step{width:auto!important;white-space:nowrap;flex:none;padding:10px!important;min-height:44px!important}.registry-profile-summary__details{grid-template-columns:1fr;gap:16px}.registry-profile-summary__detail+ .registry-profile-summary__detail{border-left:0;border-top:1px solid #e3eaf7;padding:16px 0 0}}
@media(max-width:600px){.registry-dialog--editor .registry-wizard-header{min-height:86px;padding:14px 16px!important}.registry-dialog--editor .registry-wizard-header__icon{width:42px;height:42px;border-radius:12px!important}.registry-dialog--editor .registry-wizard-header__copy .text-h6{font-size:19px!important}.registry-dialog--editor .registry-wizard-main{padding:13px!important}.registry-dialog--editor .registry-overview-block{padding:15px!important}.registry-dialog--editor .registry-overview-block--profile{padding:0!important}.registry-profile-summary{padding:16px;gap:10px}.registry-profile-summary__copy{padding-left:10px}.registry-profile-summary__copy h3{font-size:19px}.registry-profile-summary__icon{width:43px;height:43px}.registry-profile-summary__status{margin-left:0}.registry-profile-summary__details{padding:16px}.registry-dialog--editor .registry-wizard-footer{padding:9px!important}}
</style>

<style scoped>
/* Management-only layout: one shared two-column grid for every editable field. */
.registry-management {
  gap: 22px !important;
}
.registry-management__card {
  background: #fff;
  border: 1px solid #dae4f8;
  border-radius: 17px;
  overflow: hidden;
  box-shadow: 0 6px 22px rgba(20, 55, 116, .035);
}
.registry-management__heading {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 23px;
  background: linear-gradient(110deg, #f0f5ff, #f9fbff);
  border-bottom: 1px solid #e3eafa;
}
.registry-management__icon {
  display: grid;
  place-items: center;
  flex: none;
  width: 47px;
  height: 47px;
  border-radius: 13px;
  background: #e0eaff;
  color: #0038a8;
}
.registry-management__heading h3 {
  margin: 0 0 3px;
  font-size: 18px;
  font-weight: 800;
  line-height: 1.3;
  color: #102e6c;
}
.registry-management__heading p {
  margin: 0;
  font-size: 12px;
  color: #7184a5;
  line-height: 1.45;
}
/* The type field occupies the first cell. The conditional row takes both
   columns, so each conditional field matches the width of the type field. */
.registry-dialog--editor .registry-management__body {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 16px;
  row-gap: 16px;
  align-items: start;
  padding: 24px;
}
.registry-dialog--editor .registry-management__type {
  grid-column: 1 / -1;
  width: 100%;
  max-width: none;
  min-width: 0;
}
.registry-dialog--editor .registry-management__conditional {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  width: 100%;
  max-width: none;
  min-width: 0;
}
.registry-dialog--editor .registry-management__conditional > .q-field,
.registry-dialog--editor .registry-management__timeline > .q-field,
.registry-dialog--editor .registry-management__type {
  min-width: 0;
  width: 100%;
  margin: 0;
}
/* No shrinking the Managing Office field when it is the only visible option. */
.registry-dialog--editor .registry-management__timeline {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.registry-dialog--editor .registry-management__timeline > .registry-management__duration {
  grid-column: 1 / -1;
}
/* Same input height, same outline radius, same text alignment on all 6 controls. */
.registry-dialog--editor .registry-management :deep(.q-field--outlined .q-field__control) {
  min-height: 56px;
  height: 56px;
  border-radius: 9px;
  background: #fff;
}
.registry-dialog--editor .registry-management :deep(.q-field__marginal) {
  height: 56px;
}
.registry-dialog--editor .registry-management :deep(.q-field__native),
.registry-dialog--editor .registry-management :deep(.q-field__input) {
  min-width: 0;
}
@media (max-width: 720px) {
  .registry-management__heading { padding: 16px; }
  .registry-dialog--editor .registry-management__body {
    grid-template-columns: minmax(0, 1fr);
    padding: 16px;
  }
  .registry-dialog--editor .registry-management__conditional,
  .registry-dialog--editor .registry-management__timeline {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>

<style scoped>
/* Stakeholders: Managing Office selection beside assigned groups. */
.registry-stakeholders-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
  gap: 20px;
  width: 100%;
}
.registry-stakeholders-column {
  min-width: 0;
  border: 1px solid #dce5f5;
  border-radius: 15px;
  background: #fff;
  padding: 18px;
  box-shadow: 0 4px 15px rgba(19, 51, 113, .035);
}
.registry-stakeholders-column__heading {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.registry-stakeholders-column__icon {
  width: 40px;
  height: 40px;
  flex: none;
  display: grid;
  place-items: center;
  background: #eaf1ff;
  color: #0038a8;
  border-radius: 11px;
}
.registry-stakeholders-column__heading h3 {
  color: #102e6c;
  font-size: 15px;
  font-weight: 800;
  line-height: 1.35;
  margin: 0;
}
.registry-stakeholders-column__heading p {
  color: #7585a1;
  font-size: 11px;
  margin: 3px 0 0;
}
.registry-stakeholders-column .registry-stakeholder-section {
  margin: 0;
  padding: 0;
  border: 0;
}
.registry-stakeholders-column .registry-stakeholder-section__title {margin-bottom: 13px;}
.registry-stakeholders-column .registry-assign-controls {flex-wrap: wrap;}
.registry-stakeholders-column .registry-assign-type {flex: 1 1 200px;}
.registry-stakeholders-column .registry-assigned-groups {gap: 12px;}
.registry-stakeholders-column .registry-stakeholder-item {padding: 10px;gap: 8px;}
.registry-stakeholders-column .registry-stakeholder-person {flex-basis: 120px;}
.registry-stakeholders-column .registry-stakeholder-list {max-height: 400px;}
@media (max-width: 1080px) {
  .registry-stakeholders-grid {grid-template-columns: 1fr;}
}
@media (max-width: 600px) {
  .registry-stakeholders-column {padding: 13px;}
  .registry-stakeholders-column .registry-assign-controls > .q-btn {width: 100%;}
}
</style>

<style scoped>
/* Business Owner and Managing Office panels share the assignment column. */
.registry-stakeholders-column > .registry-stakeholder-section + .registry-stakeholder-section {
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px solid #e3eaf7;
}
</style>

<style scoped>
/* Two stacked workflow sections; each contains Owner | Managing Office columns. */
.registry-stakeholders-layout { gap: 22px !important; }
.registry-stakeholder-workflow { min-width: 0; }
.registry-stakeholder-workflow > .registry-stakeholders-column__heading { margin: 0 0 14px; }
.registry-stakeholders-layout .registry-stakeholders-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: start; gap: 16px; }
.registry-stakeholders-layout .registry-stakeholder-section,
.registry-stakeholders-layout .registry-assigned-department { min-width: 0; border: 1px solid #dce5f5; border-radius: 14px; background: #fff; padding: 16px; box-shadow: 0 4px 15px rgba(19,51,113,.035); }
.registry-stakeholders-layout .registry-stakeholder-section__title { margin-bottom: 14px; }
.registry-stakeholders-layout .registry-stakeholder-list { max-height: 285px; }
.registry-stakeholders-layout .registry-assign-controls { flex-wrap: wrap; padding: 12px; }
.registry-stakeholders-layout .registry-assign-type { flex: 1 1 185px; }
.registry-assigned-unclassified { margin-top: 16px; padding: 16px; border: 1px dashed #cfd9ee; border-radius: 14px; background: #f8faff; }
@media (max-width: 980px) { .registry-stakeholders-layout .registry-stakeholders-grid { grid-template-columns: 1fr; } }
</style>

<style scoped lang="scss">
/* Repository tab: Library-driven solution buttons, scoped repository cards. */
.registry-repository-section{background:#fff;border:1px solid #dce5f6;border-radius:15px;padding:20px;min-width:0}
.registry-repository-section__header{display:flex;align-items:center;gap:12px;color:#0038a8;margin-bottom:17px}
.registry-repository-section__header h3{font-size:16px;line-height:1.3;font-weight:800;color:#143269;margin:0}
.registry-repository-section__header p{font-size:12px;line-height:1.4;color:#6b7da0;margin:4px 0 0}
.registry-repository-options{display:grid;grid-template-columns:repeat(auto-fit,minmax(128px,1fr));gap:10px}
.registry-repository-option{appearance:none;border:1px solid #dce5f5;border-radius:11px;background:#f8faff;color:#294677;display:flex;align-items:center;justify-content:center;gap:9px;padding:13px 10px;cursor:pointer;font:inherit;font-size:12px;font-weight:750;min-height:54px;transition:background .15s,border-color .15s}
.registry-repository-option:hover{background:#eef4ff;border-color:#8aaee8}
.registry-repository-option.is-selected{background:#eaf2ff;border:2px solid #0038a8;color:#0038a8;padding:12px 9px}
.registry-repository-option:focus-visible{outline:3px solid #96b7f4;outline-offset:2px}
.registry-repository-pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.registry-repository-fields{display:grid;grid-template-columns:1fr;gap:16px}
.registry-repository-fields>.q-field{min-width:0;width:100%}
@media(max-width:780px){.registry-repository-pair{grid-template-columns:1fr}.registry-repository-section{padding:16px}}
</style>

<style scoped>
/* Technology Used step: presentation only; model bindings remain unchanged. */
.registry-technology { display: flex; flex-direction: column; gap: 20px; }
.registry-technology__intro { display: flex; align-items: center; gap: 13px; padding: 4px 0 2px; }
.registry-technology__intro-icon { display: grid; place-items: center; flex: none; width: 48px; height: 48px; border-radius: 14px; background: #e7efff; color: #0038a8; }
.registry-technology__intro h3 { margin: 0; color: #102f6a; font-size: 17px; font-weight: 800; line-height: 1.35; }
.registry-technology__intro p { margin: 4px 0 0; font-size: 12px; color: #6b7e9d; line-height: 1.5; }
.registry-technology__stack-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.registry-technology__card { min-width: 0; padding: 22px; border: 1px solid #dae5f6; border-radius: 17px; background: #fff; box-shadow: 0 5px 20px rgba(16, 50, 109, .04); }
.registry-technology__card-header { display: flex; align-items: center; gap: 12px; padding-bottom: 17px; margin-bottom: 20px; border-bottom: 1px solid #edf1f8; }
.registry-technology__card-icon { flex: none; display: grid; place-items: center; width: 43px; height: 43px; border-radius: 12px; }
.registry-technology__card-icon--frontend { background: #e7efff; color: #0038a8; }
.registry-technology__card-icon--backend { background: #e7f4f7; color: #14647c; }
.registry-technology__card-icon--infra { background: #eef0ff; color: #3b4ba0; }
.registry-technology__card-header h4 { margin: 0; color: #17356c; font-size: 15px; font-weight: 800; line-height: 1.4; }
.registry-technology__card-header p { margin: 3px 0 0; color: #7383a0; font-size: 11px; line-height: 1.5; }
.registry-technology__field { width: 100%; min-width: 0; }
.registry-technology :deep(.registry-technology__field.q-field--outlined .q-field__control) { min-height: 56px; border-radius: 10px; background: #fff; }
.registry-technology :deep(.registry-technology__field .q-field__prepend) { color: #6480b2; }
.registry-technology__helper { display: flex; align-items: center; gap: 6px; margin-top: 12px; font-size: 11px; color: #7182a2; }
.registry-technology__infra-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.registry-technology__server-name { grid-column: 1 / -1; }
@media (max-width: 850px) {
  .registry-technology__stack-grid { grid-template-columns: 1fr; }
}
@media (max-width: 600px) {
  .registry-technology__card { padding: 16px; }
  .registry-technology__infra-grid { grid-template-columns: 1fr; }
  .registry-technology__server-name { grid-column: auto; }
  .registry-technology__intro { align-items: flex-start; }
}
</style>

<style scoped>
/* Scrum planning preview — visually separate from the Registry wizard */
.scrum-planner { display:flex; flex-direction:column; width:100%; height:100%; min-height:0; background:#f5f7fc; color:#243454; font-family:inherit; }
.scrum-planner__header { display:flex; align-items:center; justify-content:space-between; gap:20px; flex-shrink:0; padding:19px 28px; background:linear-gradient(112deg,#10296e 0%,#214ca1 67%,#316bc7 100%); color:#fff; }
.scrum-planner__identity,.scrum-planner__header-actions { display:flex; align-items:center; gap:16px; }
.scrum-planner__mark { display:flex; align-items:center; justify-content:center; width:50px; height:50px; border-radius:14px; background:rgba(255,255,255,.13); border:1px solid rgba(255,255,255,.21); }
.scrum-planner__eyebrow { font-size:10px; font-weight:800; letter-spacing:1.5px; color:#b9d3ff; }
.scrum-planner__eyebrow span { padding:0 7px; opacity:.6; }
.scrum-planner__identity h2 { font-size:22px; font-weight:800; line-height:1.25; margin:4px 0 2px; }
.scrum-planner__identity p { margin:0; font-size:12px; color:#d4e2ff; }
.scrum-planner__preview-badge { background:rgba(255,255,255,.15); border:1px solid rgba(255,255,255,.23); color:#fff; font-weight:700; font-size:10px; padding:7px 10px; letter-spacing:.5px; }
.scrum-planner__overview { padding:18px 28px; display:grid; grid-template-columns:minmax(240px,2fr) repeat(4,minmax(105px,1fr)); gap:12px; flex-shrink:0; }
.scrum-planner__project,.scrum-planner__metric { min-height:78px; display:flex; align-items:center; gap:12px; border-radius:13px; border:1px solid #e0e6f1; background:#fff; padding:14px 16px; box-shadow:0 2px 8px rgba(25,44,92,.025); }
.scrum-planner__project-icon { display:grid; place-items:center; width:43px; height:43px; background:#e9efff; color:#17499a; border-radius:11px; }
.scrum-planner__project div:last-child,.scrum-planner__metric div { display:flex; flex-direction:column; min-width:0; }
.scrum-planner__project small,.scrum-planner__sprint-summary span { color:#8693ad; letter-spacing:1px; font-size:9px; font-weight:800; }
.scrum-planner__project strong { font-weight:800; font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.scrum-planner__project div:last-child>span { color:#7483a1; font-size:11px; }
.scrum-planner__metric>.q-icon { color:#2c65b6; font-size:22px; }
.scrum-planner__metric strong { font-size:22px; font-weight:850; line-height:1.2; }
.scrum-planner__metric span { color:#7a879e; font-size:11px; white-space:nowrap; }
.scrum-planner__notice { margin:0 28px 16px; border:1px solid #d8e4f8; background:#eef4ff; color:#345487; padding:11px 14px; border-radius:10px; display:flex; align-items:flex-start; gap:10px; font-size:12px; line-height:1.55; flex-shrink:0; }
.scrum-planner__notice .q-icon { flex-shrink:0; margin-top:1px; }
.scrum-planner__workspace { display:grid; grid-template-columns:minmax(0,1.04fr) minmax(0,.96fr); gap:18px; padding:0 28px 18px; flex:1; min-height:0; }
.scrum-planner__column { display:flex; flex-direction:column; min-height:0; background:#fff; border:1px solid #dfe6f2; border-radius:16px; overflow:hidden; box-shadow:0 5px 17px rgba(30,52,98,.035); }
.scrum-planner__column-head { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:18px 20px 15px; flex-shrink:0; }
.scrum-planner__column-title { display:flex; gap:11px; align-items:center; }
.scrum-planner__column-title h3 { margin:0; font-size:15px; font-weight:800; }
.scrum-planner__column-title p { margin:3px 0 0; font-size:11px; color:#8a95a9; }
.scrum-planner__column-icon { display:grid; place-items:center; width:40px; height:40px; border-radius:11px; }
.scrum-planner__column-icon--ai { background:#f0ecff; color:#7356bc; }
.scrum-planner__column-icon--sprint { background:#e6f1ff; color:#215db0; }
.scrum-planner__count { background:#edf1f9; color:#4b5d7d; border-radius:20px; font-weight:750; padding:7px 10px; }
.scrum-planner__view-tabs { display:flex; gap:16px; padding:0 20px 12px; border-bottom:1px solid #edf0f6; flex-shrink:0; flex-wrap:wrap; }
.scrum-planner__view-tab { display:inline-flex; align-items:center; gap:7px; background:transparent; border:0; border-bottom:2px solid transparent; padding:8px 0; font:inherit; font-size:12px; font-weight:700; color:#718099; cursor:pointer; }
.scrum-planner__view-tab.is-selected { color:#234ea2; border-bottom-color:#234ea2; }
.scrum-planner__connection-panel { padding:12px 20px 14px; border-bottom:1px solid #edf0f6; flex-shrink:0; max-height:265px; overflow-y:auto; }
.scrum-planner__connection-label { display:flex; gap:6px; align-items:center; font-size:11px; font-weight:800; color:#495b76; margin-bottom:7px; }
.scrum-planner__connection-tabs { display:flex; align-items:center; gap:6px; overflow-x:auto; padding-bottom:7px; }
.scrum-planner__connection-count { display:inline-block; margin-left:4px; font-size:10px; opacity:.75; }
.scrum-planner__connection-story,.scrum-planner__connection-criterion { font-size:11px; line-height:1.5; color:#536680; margin:2px 0 10px; }
.scrum-planner__connection-caption { font-size:10px; color:#8290a5; margin-top:5px; }
.scrum-planner__filters { display:flex; gap:6px; align-items:center; overflow-x:auto; padding:0 20px 14px; flex-shrink:0; }
.scrum-planner__filter,.scrum-planner__sprint-tab { font-family:inherit; cursor:pointer; border:1px solid #e0e5ef; border-radius:8px; padding:7px 11px; font-size:11px; font-weight:750; background:#fff; color:#667590; white-space:nowrap; transition:background .2s,color .2s; }
.scrum-planner__filter.is-selected { color:#fff; background:#234ea2; border-color:#234ea2; }
.scrum-planner__task-list { background:#f9fbfe; border-top:1px solid #eef0f6; flex:1; overflow-y:auto; min-height:0; padding:14px; display:flex; flex-direction:column; gap:10px; }
.scrum-planner__task { padding:14px 15px 12px; border:1px solid #e1e7f1; border-radius:12px; background:#fff; cursor:grab; box-shadow:0 2px 8px rgba(34,51,86,.025); }
.scrum-planner__task.is-dragging { opacity:.5; }
.scrum-planner__task-meta { display:flex; align-items:center; gap:8px; }
.scrum-planner__drag-handle { margin-left:auto; color:#aeb8cc; cursor:grab; font-size:19px; }
.scrum-planner__task h4,.scrum-planner__planned-task h4 { font-size:13px; margin:8px 0 5px; line-height:1.4; font-weight:800; }
.scrum-planner__task p { margin:0 0 12px; color:#79879a; font-size:11px; line-height:1.5; }
.scrum-planner__task-bottom,.scrum-planner__planned-bottom { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; }
.scrum-planner__tags { display:flex; gap:6px; }
.scrum-planner__tags span { display:flex; align-items:center; gap:3px; background:#f2f5fa; border-radius:5px; padding:5px 7px; color:#6f7f99; font-size:10px; font-weight:700; }
.scrum-planner__review-state { border-radius:20px; background:#fff5e3; color:#a9711c; font-size:10px; padding:5px 9px; font-weight:750; white-space:nowrap; }
.scrum-planner__review-state.is-approved { background:#e7f7ed; color:#18844c; }
.scrum-planner__review-state.is-revision { background:#ffedeb; color:#b45445; }
.scrum-planner__review-actions,.scrum-planner__planned-actions { display:flex; justify-content:flex-end; gap:4px; flex-wrap:wrap; padding-top:10px; margin-top:10px; border-top:1px solid #eef1f6; }
.scrum-planner__review-actions .q-btn,.scrum-planner__planned-actions .q-btn { font-size:11px; }
.scrum-planner__sprint-tabs { display:flex; gap:7px; border-bottom:1px solid #e9eef6; padding:0 20px 13px; overflow-x:auto; flex-shrink:0; }
.scrum-planner__sprint-tab { border-color:transparent; background:#f4f6fb; }
.scrum-planner__sprint-tab.is-selected { background:#e7efff; color:#1a4ca1; border-color:#bdd1fb; }
.scrum-planner__sprint-tab span { display:inline-block; font-size:10px; margin-left:6px; background:#fff; border-radius:6px; padding:2px 5px; }
.scrum-planner__sprint-summary { display:flex; align-items:center; justify-content:space-between; gap:10px; background:#f8faff; padding:12px 20px; flex-shrink:0; }
.scrum-planner__sprint-summary div { display:flex; flex-direction:column; gap:3px; }
.scrum-planner__sprint-summary strong { font-size:13px; color:#28426e; }
.scrum-planner__sprint-summary { gap:16px; flex-wrap:wrap; }
.scrum-planner__sprint-dates { display:flex !important; flex-direction:row !important; align-items:center; flex:1 1 260px; gap:10px !important; min-width:0; }
.scrum-planner__sprint-dates .q-field { flex:1 1 0; min-width:110px; max-width:190px; }
.scrum-planner__sprint-effort { margin-left:auto; text-align:right; white-space:nowrap; }
.scrum-planner__sprint-effort small { font-size:11px; color:#63789b; }
@media(max-width:650px) { .scrum-planner__sprint-dates { order:3; flex-basis:100%; } .scrum-planner__sprint-effort { margin-left:auto; } }
.scrum-planner__dropzone { margin:14px; border:2px dashed #ccdaee; border-radius:13px; padding:12px; flex:1; min-height:190px; background:#fafdff; overflow:auto; display:flex; flex-direction:column; gap:11px; }
.scrum-planner__dropzone.is-over { border-color:#3975cd; background:#f0f5ff; }
.scrum-planner__drop-hint { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:9px; text-align:center; margin:auto; padding:28px 15px; }
.scrum-planner__drop-icon { background:#eaf0fb; color:#6789c3; display:grid; place-items:center; width:69px; height:69px; border-radius:50%; }
.scrum-planner__drop-hint strong { font-size:15px; }
.scrum-planner__drop-hint p { margin:0; max-width:270px; font-size:12px; line-height:1.6; color:#79879d; }
.scrum-planner__drop-hint>span:last-child { color:#8996ad; font-size:11px; }
.scrum-planner__planned-task { border:1px solid #dce6f5; background:#fff; border-radius:10px; padding:13px; cursor:grab; box-shadow:0 2px 6px rgba(27,53,99,.04); }
.scrum-planner__planned-bottom { color:#8390a5; font-size:11px; }
.scrum-planner__sprint-footer { padding:12px 20px; border-top:1px solid #ecf0f6; display:flex; align-items:center; gap:9px; color:#7c8ba1; font-size:11px; flex-shrink:0; }
.scrum-planner__sprint-footer .q-icon { color:#3568b5; }
.scrum-planner__empty { display:flex; flex-direction:column; align-items:center; gap:6px; padding:40px 20px; text-align:center; color:#8996aa; }
.scrum-planner__empty strong { color:#5f7292; }
.scrum-planner__empty span { font-size:11px; }
.scrum-planner__footer { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-shrink:0; padding:13px 28px; border-top:1px solid #e3e8f2; background:#fff; }
.scrum-planner__footer>span { color:#94a1b4; font-size:11px; display:flex; align-items:center; gap:7px; }
.scrum-planner__footer>div { display:flex; gap:8px; }
@media (max-width:1100px) { .scrum-planner__overview { grid-template-columns:repeat(4,minmax(0,1fr)); }.scrum-planner__project { grid-column:span 4; }.scrum-planner__workspace { gap:12px; }.scrum-planner__header { padding:18px; }.scrum-planner__workspace { padding:0 18px 14px; }.scrum-planner__overview { padding:14px 18px; }.scrum-planner__notice { margin:0 18px 12px; } }
@media (max-width:750px) { .scrum-planner__header-actions .scrum-planner__preview-badge { display:none; }.scrum-planner__identity h2 { font-size:18px; }.scrum-planner__identity p { font-size:11px; }.scrum-planner__workspace { grid-template-columns:1fr; overflow:auto; }.scrum-planner__column { min-height:425px; }.scrum-planner__overview { grid-template-columns:repeat(2,minmax(0,1fr)); }.scrum-planner__project { grid-column:span 2; }.scrum-planner__footer { padding:12px 18px; }.scrum-planner__footer>span { display:none; } }
</style>

<style scoped>
.registry-execution-confirm { width:min(690px,calc(100vw - 32px)); max-width:690px; border-radius:18px; overflow:hidden; }
.registry-execution-confirm__header { display:flex; align-items:center; gap:15px; padding:22px 24px; color:white; background:linear-gradient(115deg,#102c75 0%,#2357b0 100%); }
.registry-execution-confirm__icon { background:rgba(255,255,255,.15); border:1px solid rgba(255,255,255,.18); display:grid; place-items:center; width:52px; height:52px; flex:none; border-radius:13px; }
.registry-execution-confirm__heading { min-width:0; flex:1; }
.registry-execution-confirm__heading h2 { font-size:21px; line-height:1.3; font-weight:800; margin:4px 0; }
.registry-execution-confirm__heading p { margin:0; color:#dce8ff; font-size:12px; }
.registry-execution-confirm__eyebrow { font-size:10px; letter-spacing:1.4px; font-weight:800; color:#c9dcff; }
.registry-execution-confirm__body { padding:23px 24px 12px; }
.registry-execution-confirm__intro { display:flex; align-items:flex-start; gap:10px; background:#eef4ff; border:1px solid #d8e5fb; color:#294c80; padding:13px; border-radius:11px; }
.registry-execution-confirm__intro .q-icon { flex:none; margin-top:2px; }
.registry-execution-confirm__intro p { margin:0; font-size:12px; line-height:1.65; }
.registry-execution-confirm__section-title { margin:20px 0 11px; font-weight:800; font-size:13px; color:#263c65; }
.registry-execution-confirm__docs { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
.registry-execution-confirm__doc { display:flex; align-items:center; gap:10px; background:#fff; border:1px solid #e0e7f2; border-radius:11px; padding:13px; min-width:0; }
.registry-execution-confirm__doc-icon { width:37px; height:37px; flex:none; border-radius:10px; background:#eaf0ff; color:#2959a8; display:grid; place-items:center; }
.registry-execution-confirm__doc>div:nth-child(2) { min-width:0; display:flex; flex-direction:column; gap:3px; }
.registry-execution-confirm__doc strong { font-size:11px; line-height:1.4; color:#283957; }
.registry-execution-confirm__doc span { color:#7a8ba7; font-size:10px; font-weight:700; }
.registry-execution-confirm__doc-mark { flex:none; color:#a9b9d2; margin-left:auto; }
.registry-execution-confirm__preview-note { display:flex; gap:9px; align-items:flex-start; padding:11px 12px; background:#fff8e8; border:1px solid #f1e2b9; color:#7a5c21; border-radius:9px; margin-top:15px; font-size:11px; line-height:1.6; }
.registry-execution-confirm__preview-note .q-icon { flex:none; }
.registry-execution-confirm__checkbox { margin:12px 0 3px; color:#344663; font-size:12px; align-items:flex-start; }
.registry-execution-confirm__footer { padding:13px 24px; gap:8px; }
@media (max-width:560px) { .registry-execution-confirm__header { padding:17px; } .registry-execution-confirm__body { padding:17px 17px 10px; } .registry-execution-confirm__docs { grid-template-columns:1fr; } .registry-execution-confirm__footer { padding:12px 17px; } .registry-execution-confirm__heading h2 { font-size:18px; } }
</style>

<style scoped>
/* ONE ICTMS task discipline and hierarchy details */
.scrum-planner__category { border-radius:5px; padding:4px 7px; background:#e8f3ff; color:#205b9b; font-size:10px; font-weight:800; }
.scrum-planner__category--backend { background:#e9f8f0; color:#137c52; }
.scrum-planner__category--db { background:#fff0dc; color:#9b6015; }
.scrum-planner__category--ui-ux { background:#f3eaff; color:#7847a3; }
.scrum-planner__trace { margin:10px 0 12px; display:grid; gap:7px; }
.scrum-planner__trace > div { display:grid; grid-template-columns:115px minmax(0,1fr); gap:9px; font-size:11px; line-height:1.5; }
.scrum-planner__trace b { color:#4f6590; }
.scrum-planner__trace span,.scrum-planner__planned-context { color:#697c95; overflow-wrap:anywhere; }
.scrum-planner__planned-context { font-size:11px; line-height:1.5; margin-bottom:7px; }
@media (max-width:550px) { .scrum-planner__trace > div { grid-template-columns:1fr; gap:1px; } }
</style>

<style scoped>
.scrum-planner__generated-heading { display:flex; align-items:center; gap:7px; color:#465b7b; font-size:11px; font-weight:700; }
.scrum-planner__assignment-state { display:flex; align-items:center; gap:5px; margin:4px 0 9px; color:#66758d; font-size:11px; }
.scrum-planner__module-group { display: flex; flex-direction: column; gap: 10px; margin-bottom: 14px; }
.scrum-planner__module-heading { border: 1px solid #e3e8f1; border-radius: 10px; padding: 12px 14px; background: #fff; display: flex; flex-direction: column; gap: 9px; }
.scrum-planner__module-criterion { display: flex; align-items: flex-start; gap: 7px; font-size: 11px; font-weight: 700; color: #455570; line-height: 1.5; }
.scrum-planner__module-criterion span { font-weight: 400; color: #596984; }
.scrum-planner__module-title { display: flex; align-items: center; gap: 7px; font-size: 12px; color: #293b57; }
.scrum-planner__module-title span { margin-left: auto; color: #77849a; font-size: 11px; }
</style>

<style scoped>
.scrum-planner__trace-accordion { padding: 8px 12px; }
.scrum-planner__criterion-item { border: 1px solid #dbe2f0; border-radius: 10px; margin-bottom: 10px; background: #fff; overflow: hidden; }
.scrum-planner__criterion-body { padding: 8px 12px 16px; }
.scrum-planner__criterion-body .scrum-planner__module-group { margin-bottom: 16px; }
.scrum-planner__criterion-body .scrum-planner__task { margin-top: 10px; }
</style>

<style scoped>
/* Compact, always-visible generated tasks under each acceptance criterion. */
.scrum-planner__trace-task-row { border: 1px solid #dce4f1; border-radius: 9px; background: #fff; overflow: hidden; cursor: grab; }
.scrum-planner__trace-task-row + .scrum-planner__trace-task-row { margin-top: 6px; }
.scrum-planner__trace-task-heading { display: flex; flex-wrap: wrap; align-items: center; gap: 7px; min-width: 0; }
.scrum-planner__trace-task-code { font-size: 11px; font-weight: 800; color: #234ea2; border: 1px solid #d6e2f5; background: #eef4ff; padding: 3px 7px; border-radius: 5px; white-space: nowrap; }
.scrum-planner__trace-task-name { font-size: 12px; font-weight: 750; color: #263853; overflow-wrap: anywhere; }
.scrum-planner__trace-task-subtitle { display: flex; gap: 6px; margin-top: 3px; font-size: 10px; color: #73829a; }
.scrum-planner__trace-task-details { padding: 5px 13px 13px; border-top: 1px solid #eef1f6; }
.scrum-planner__trace-task-expand :deep(.q-item) { min-height: 44px; padding: 7px 10px; }
.scrum-planner__trace-task-expand :deep(.q-item__section--side) { padding-left: 6px; }
.scrum-planner__criterion-body .scrum-planner__module-group { gap: 5px; }
.scrum-planner__criterion-body .scrum-planner__module-heading { gap: 4px; padding: 9px 11px; }
</style>

<style scoped>

/* Stable visible task rows; no nested expansion-item layout or clipped badges. */
.scrum-planner__trace-accordion > .scrum-planner__criterion-item { flex-shrink: 0; }
.scrum-planner__criterion-body .scrum-planner__module-group { min-width: 0; flex-shrink: 0; gap: 6px; margin-bottom: 10px; }
.scrum-planner__criterion-body .scrum-planner__module-heading { padding: 9px 11px; gap: 4px; }
.scrum-planner__trace-task-row { display: block; flex: none; min-width: 0; overflow: visible; padding: 8px 10px; }
.scrum-planner__trace-task-toggle { display: flex; width: 100%; min-width: 0; align-items: center; flex-wrap: wrap; gap: 7px; padding: 0; border: 0; background: transparent; font: inherit; text-align: left; cursor: pointer; }
.scrum-planner__trace-task-toggle:focus-visible { outline: 2px solid #234ea2; outline-offset: 3px; border-radius: 4px; }
.scrum-planner__trace-task-name { flex: 1 1 160px; min-width: 0; }
.scrum-planner__trace-task-chevron { color: #73829a; margin-left: auto; flex-shrink: 0; }
.scrum-planner__trace-task-subtitle { margin: 4px 0 0; }
.scrum-planner__trace-task-details { margin-top: 9px; padding: 9px 2px 2px; }

.scrum-review-page { display:flex; flex-direction:column; height:100vh; background:#f5f7fc; }
.scrum-review-page__header { background:linear-gradient(110deg,#142c69,#2554aa); color:#fff; padding:24px 30px; display:flex; justify-content:space-between; align-items:center; gap:20px; }
.scrum-review-page__header h2 { font-size:23px; font-weight:750; margin:3px 0; }
.scrum-review-page__header p { margin:0; opacity:.85; font-size:12px; }
.scrum-review-page__summary { display:flex; flex-wrap:wrap; gap:14px; padding:17px 28px 0; }
.scrum-review-page__summary span { padding:11px 16px; border:1px solid #dce4f2; border-radius:10px; background:#fff; font-size:12px; color:#4e607e; }
.scrum-review-page__summary b { font-size:17px; color:#1b407e; margin-right:4px; }
.scrum-review-page__toolbar { display:flex; flex-wrap:wrap; gap:12px; padding:18px 28px 12px; }
.scrum-review-page__search { flex:1; min-width:230px; }
.scrum-review-page__body { overflow:auto; flex:1; padding:0 28px 24px; }
.scrum-review-page__story { padding:17px; background:#fff; border:1px solid #dce4f2; border-radius:13px; margin-bottom:15px; }
.scrum-review-page__story-title { display:flex; align-items:flex-start; gap:10px; color:#243e6d; font-size:13px; margin-bottom:13px; }
.scrum-review-page__criterion { padding:12px; border:1px solid #e0e7f2; border-radius:9px; margin-top:12px; }
.scrum-review-page__criterion-title { display:flex; align-items:flex-start; gap:9px; color:#4b6181; font-size:12px; margin-bottom:12px; }
.scrum-review-page__task { border:1px solid #e3e9f4; border-radius:9px; padding:14px; margin-top:9px; }
.scrum-review-page__task-top { display:flex; align-items:flex-start; gap:10px; flex-wrap:wrap; }
.scrum-review-page__task-name { flex:1; min-width:200px; display:flex; flex-direction:column; gap:4px; color:#21395f; font-size:13px; }
.scrum-review-page__task-name small { color:#71809b; font-size:11px; }
.scrum-review-page__task p { color:#53667f; font-size:12px; margin:9px 0; }
.scrum-review-page__dependencies { color:#6b7b92; font-size:11px; }
.scrum-review-page__actions { display:flex; flex-wrap:wrap; justify-content:flex-end; gap:8px; margin-top:12px; }
.scrum-review-page__footer { flex-shrink:0; padding:14px 28px; background:#fff; border-top:1px solid #dee5f0; display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; color:#687b96; font-size:12px; }
.scrum-task-editor { width:min(760px, calc(100vw - 24px)); max-width:760px; }
.scrum-task-editor__fields { display:flex; flex-direction:column; gap:13px; max-height:65vh; overflow:auto; }
.scrum-task-editor__grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
@media(max-width:650px) { .scrum-review-page__header { padding:18px; } .scrum-review-page__toolbar,.scrum-review-page__body { padding-left:15px; padding-right:15px; } .scrum-task-editor__grid { grid-template-columns:1fr; } }
/* Criterion-level task creation and linked task overview. */
.scrum-review-page__linked-tasks { margin-top: 12px; display: grid; gap: 7px; }
.scrum-review-page__linked-task { display: flex; align-items: center; gap: 12px; padding: 9px 12px; border: 1px solid #e3e9f3; border-radius: 8px; background: #f9fbff; min-width: 0; }
.scrum-review-page__linked-task .col { min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.scrum-review-page__linked-task .col strong { font-size: 12px; overflow-wrap: anywhere; }
.scrum-review-page__linked-task .col small { font-size: 11px; color: #667792; }
@media(max-width: 650px) { .scrum-review-page__linked-task { flex-wrap: wrap; } }


/* Task Review visual refresh: consistent spacing, compact filters and accessible controls */
.scrum-review-page { background:#f4f6fb; }
.scrum-review-page__header { padding:20px 28px; min-height:98px; }
.scrum-review-page__summary { display:flex; align-items:stretch; gap:10px; padding:16px 26px 10px; }
.scrum-review-page__summary > span { display:flex; align-items:center; gap:7px; padding:10px 13px; min-height:48px; }
.scrum-review-page__summary > span b { margin:0; }
.scrum-review-page__progress { flex:1 1 220px; min-width:180px; display:flex; flex-direction:column; justify-content:center; gap:7px; padding:7px 5px 7px 14px; }
.scrum-review-page__progress-caption { display:flex; justify-content:space-between; gap:12px; color:#5d6c83; font-size:11px; }
.scrum-review-page__progress-caption strong { font-weight:650; }
.scrum-review-page__toolbar { padding:8px 26px 13px; align-items:center; gap:10px; }
.scrum-review-page__toolbar :deep(.q-field--dense .q-field__control) { min-height:42px; height:42px; }
.scrum-review-page__status-select { min-width:172px; }
.scrum-review-page__main-tabs { padding:0 26px; border-bottom:1px solid #dce4f0; gap:10px; }
.scrum-review-page__main-tabs :deep(.q-tab) { min-height:48px; padding:0 15px; }
.scrum-review-page__body { padding:18px 26px 24px; }
.scrum-review-page__module-tools { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:14px; margin-bottom:18px; }
.scrum-review-page__category-switch { display:flex; flex-wrap:wrap; gap:7px; }
.scrum-review-page__category-button { border:1px solid #dce3ef; border-radius:9px; background:white; color:#526581; padding:0 14px; min-height:36px; font-size:12px; font-weight:600; }
.scrum-review-page__category-button.is-active { color:white; background:#244aa3; border-color:#244aa3; }
.scrum-review-page__category-button:focus-visible, .scrum-review-page__expand-actions :deep(.q-btn):focus-visible { outline:2px solid #244aa3; outline-offset:2px; }
.scrum-review-page__expand-actions { display:flex; gap:5px; align-items:center; flex-wrap:wrap; }
.scrum-review-page__expand-actions > span { font-size:12px; color:#6c7d98; margin-right:7px; white-space:nowrap; }
.scrum-review-page__module-card { margin-bottom:11px; padding:0; border-color:#dce4f2; overflow:hidden; transition:border-color .15s,box-shadow .15s; }
.scrum-review-page__module-card:hover { border-color:#afc2e5; box-shadow:0 3px 13px rgba(26,59,117,.05); }
.scrum-review-page__module-card :deep(.q-item) { min-height:72px; padding:12px 19px; }
.scrum-review-page__module-card :deep(.q-item__section--avatar) { min-width:40px; }
.scrum-review-page__module-card :deep(.q-card__section) { padding:0 18px 17px; }
.scrum-review-page__module-name { font-size:14px; color:#1f3559; font-weight:700; }
.scrum-review-page__module-count { border-radius:7px; background:#eff3fb; color:#4d6081; font-size:11px; padding:5px 9px; }
.scrum-review-page__task { background:#fbfcff; padding:14px 15px; margin-top:9px; border-color:#e0e7f3; }
.scrum-review-page__task-top { align-items:center; }
.scrum-review-page__task-name { line-height:1.5; }
.scrum-review-page__task-name small { line-height:1.65; overflow-wrap:anywhere; }
.scrum-review-page__category-tag { display:inline-block; padding:2px 7px; border-radius:5px; background:#eaf0ff; color:#2d50a0; font-weight:600; margin-right:5px; }
.scrum-review-page__task p { margin:10px 0 6px; line-height:1.5; }
.scrum-review-page__actions { margin-top:8px; gap:5px; }
.scrum-review-page__actions :deep(.q-btn) { width:34px; height:34px; }
.scrum-review-page__no-results { min-height:230px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:9px; color:#5e718f; text-align:center; }
.scrum-review-page__no-results strong { font-size:15px; color:#263f69; }
.scrum-review-page__footer { padding:12px 26px; min-height:62px; }
@media (max-width: 1050px) { .scrum-review-page__progress { flex-basis:100%; } .scrum-review-page__module-tools { align-items:flex-start; } }
@media (max-width: 650px) { .scrum-review-page__summary { padding:12px 15px 8px; } .scrum-review-page__summary > span { flex:1 1 140px; } .scrum-review-page__toolbar { padding:8px 15px; } .scrum-review-page__status-select { min-width:140px; flex:1; } .scrum-review-page__main-tabs { padding:0 10px; } .scrum-review-page__main-tabs :deep(.q-tab) { padding:0 7px; } .scrum-review-page__body { padding:12px 14px 20px; } .scrum-review-page__expand-actions { width:100%; } .scrum-review-page__module-card :deep(.q-item) { padding:10px 12px; } .scrum-review-page__module-card :deep(.q-card__section) { padding:0 10px 12px; } .scrum-review-page__footer { padding:10px 14px; } }


/* Scrum Planning: Module -> Task only; requirement editing remains in Task Review. */
.scrum-plan-module-toolbar { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px 16px; border-top:1px solid #e9edf5; border-bottom:1px solid #e9edf5; flex-wrap:wrap; }
.scrum-plan-module-filters,.scrum-plan-module-tools { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
.scrum-plan-module-tools { color:#75839b; font-size:11px; }
.scrum-plan-module-tools .q-btn { font-size:11px; }
.scrum-plan-module-list { padding:14px 16px; gap:10px; }
.scrum-plan-module-card { background:white; border:1px solid #dfe6f2; border-radius:12px; overflow:hidden; flex-shrink:0; }
.scrum-plan-module-header { display:flex; align-items:center; gap:10px; width:100%; padding:13px 14px; border:0; background:#fff; color:#24385f; font:inherit; cursor:pointer; text-align:left; }
.scrum-plan-module-header:hover { background:#f5f8fe; }
.scrum-plan-module-name { flex:1; font-size:13px; font-weight:800; }
.scrum-plan-module-count { font-size:10px; background:#f0f3fa; color:#526889; border-radius:7px; padding:4px 8px; }
.scrum-plan-module-tasks { padding:0 12px 12px; display:flex; flex-direction:column; gap:8px; }
.scrum-plan-task-row { display:flex; gap:10px; align-items:center; flex-wrap:wrap; padding:10px; border-radius:9px; border:1px solid #e2e9f5; background:#fbfcff; }
.scrum-plan-task-row[draggable="true"] { cursor:grab; }
.scrum-plan-task-code { border-radius:5px; background:#eaf1ff; color:#2454a3; font-size:10px; font-weight:800; padding:5px 7px; }
.scrum-plan-task-copy { flex:1; min-width:145px; display:flex; flex-direction:column; gap:3px; }
.scrum-plan-task-copy strong { font-size:12px; color:#24385c; line-height:1.35; }
.scrum-plan-task-copy span { font-size:10px; color:#73839b; }
.scrum-plan-task-details { flex-basis:100%; padding:9px 12px; border-top:1px solid #e3eaf4; color:#62718a; font-size:11px; display:flex; flex-direction:column; gap:5px; }
.scrum-plan-sprint-module { display:flex; flex-direction:column; gap:9px; }
.scrum-plan-sprint-module-title { display:flex; align-items:center; gap:6px; font-size:12px; font-weight:800; color:#284d92; padding:5px 2px; }
.scrum-plan-sprint-module-title span { margin-left:auto; font-size:10px; color:#7d8ea7; }
@media(max-width:800px) { .scrum-plan-module-toolbar { align-items:flex-start; } .scrum-plan-module-tools { width:100%; } .scrum-plan-task-row { gap:6px; } }
</style>


<style scoped>
.scrum-plan-module-drag-handle { cursor: grab; opacity: 0.65; flex-shrink: 0; }
.scrum-plan-module-header[draggable="true"], .scrum-plan-sprint-module-title[draggable="true"] { cursor: grab; }
.scrum-plan-module-header[draggable="true"]:active, .scrum-plan-sprint-module-title[draggable="true"]:active { cursor: grabbing; }
</style>

<style scoped>
/* Shared module / task card appearance across the Sprint Plan and Tasks panes. */
.scrum-plan-sprint-card { flex-shrink:0; }
.scrum-plan-sprint-card .scrum-plan-sprint-module-title {
  margin:0; width:100%; padding:13px 14px; gap:10px;
  color:#24385f; background:#fff; font-size:inherit;
  border-bottom:1px solid #edf1f7;
}
.scrum-plan-sprint-card .scrum-plan-module-tasks { padding:12px; }
.scrum-plan-sprint-card .scrum-plan-task-row { min-width:0; }
.scrum-plan-sprint-card .scrum-plan-module-count { margin-left:0; }
.scrum-plan-sprint-card .scrum-plan-sprint-module-title:hover { background:#f5f8fe; }
.scrum-plan-sprint-card .scrum-plan-module-header[draggable="true"] { cursor:grab; }
</style>

<style scoped>
.scrum-team-page { display: flex; flex-direction: column; height: 100%; background: #f4f6fc; }
.scrum-team-content { flex: 1; overflow-y: auto; padding: 24px; }
.scrum-team-grid { display: grid; grid-template-columns: minmax(320px, 1fr) minmax(360px, 1fr); gap: 20px; align-items: start; }
.scrum-team-panel { background: white; border: 1px solid #dce4f3; border-radius: 14px; padding: 22px; display: flex; flex-direction: column; gap: 16px; min-width: 0; }
.scrum-team-panel__head { display: flex; align-items: center; gap: 10px; color: #213a76; font-size: 17px; margin-bottom: 4px; }
.scrum-team-row { display: flex; gap: 12px; }
.scrum-stakeholder-role-group { border: 1px solid #e0e7f4; border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; gap: 0; }
.scrum-stakeholder-role-header { display: flex; align-items: center; gap: 10px; padding: 12px 14px; background: #f3f6fc; color: #213a76; }
.scrum-stakeholder-role-group .scrum-stakeholder-row { border: 0; border-top: 1px solid #e8edf7; border-radius: 0; }
.scrum-stakeholder-row { display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid #e0e7f4; border-radius: 10px; }
.scrum-stakeholder-details { display:flex; flex:1; flex-direction:column; gap:3px; min-width:0; }
.scrum-stakeholder-details strong { font-size: 13px; color:#213a76; }
.scrum-stakeholder-details small { font-size: 12px; color:#63718e; overflow-wrap:anywhere; }
.scrum-team-module { border: 1px solid #e0e7f4; border-radius: 10px; overflow: hidden; }
.scrum-team-module__title { display: flex; align-items: center; gap: 8px; background: #f3f6fc; padding: 12px 14px; font-weight: 700; color: #203766; }
.scrum-team-task { display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; gap: 14px; border-top: 1px solid #e8edf7; }
.scrum-team-task__copy { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.scrum-team-task__copy strong { font-size: 13px; }
.scrum-team-task__copy small { color: #63718e; }
.scrum-team-assignee { width: 220px; flex-shrink: 0; }
@media (max-width: 850px) { .scrum-team-grid { grid-template-columns: 1fr; } .scrum-team-content { padding: 12px; } .scrum-team-task { flex-wrap: wrap; } .scrum-team-assignee { width: 100%; } }

/* Dedicated requirement-creation forms */
.scrum-creation-dialog { border-radius: 16px; }
.scrum-creation-dialog__preview { padding: 15px 18px; border-radius: 10px; background: #f5f7fc; color: #233458; line-height: 1.6; }
.scrum-creation-dialog__preview p { margin-top: 6px; }
</style>

<style scoped>
/* Sprint task ownership: compact popover rather than a dense select field. */
.scrum-assignee { width: 158px; flex-shrink: 0; }
.scrum-assignee__trigger {
  width:100%; min-height:39px; padding:4px 7px; text-align:left;
  background:#f4f7fd; color:#253b66; border:1px dashed #cbd6eb; border-radius:9px;
  box-shadow:none;
}
.scrum-assignee__trigger--assigned { background:#eef5ff; border:1px solid #cbdcf9; }
.scrum-assignee__trigger :deep(.q-btn__content) { width:100%; flex-wrap:nowrap; justify-content:flex-start; gap:7px; }
.scrum-assignee__avatar { background:#e2eaf8; color:#37568f; font-weight:800; font-size:13px; flex-shrink:0; }
.scrum-assignee__avatar--assigned { background:#d5e4ff; color:#234c96; font-size:11px; }
.scrum-assignee__copy { display:flex; flex:1; min-width:0; flex-direction:column; gap:1px; text-align:left; line-height:1.15; }
.scrum-assignee__copy small { font-size:9px; font-weight:500; color:#79879f; }
.scrum-assignee__copy strong { font-size:11px; font-weight:750; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
.scrum-assignee__arrow { color:#617598; flex-shrink:0; }
.scrum-assignee__menu { min-width:280px; max-width:min(360px, 92vw); border:1px solid #dae4f5; border-radius:12px; box-shadow:0 12px 35px rgba(25,46,92,.16); overflow:hidden; }
.scrum-assignee__menu-head { display:flex; flex-direction:column; gap:3px; padding:15px 16px 10px; color:#253b66; }
.scrum-assignee__menu-head strong { font-size:13px; }
.scrum-assignee__menu-head span { color:#8190a8; font-size:11px; }
.scrum-assignee__search { margin:0 12px 9px; }
.scrum-assignee__options { max-height:250px; overflow-y:auto; }
.scrum-assignee__option--selected { background:#eff5ff; color:#254d96; }
@media (max-width: 1120px) { .scrum-assignee { width:140px; } }
@media (max-width: 680px) { .scrum-assignee { width:100%; flex-basis:100%; } }
</style>

<style scoped>
.scrum-kanban-page { display:flex; flex-direction:column; height:100vh; background:#f4f7fd; }
.scrum-kanban-toolbar { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:18px 24px; flex-wrap:wrap; }
.scrum-kanban-toolbar__filters { display:flex; align-items:center; flex-wrap:wrap; gap:12px; flex:1; }
.scrum-kanban-sprint { min-width:170px; }
.scrum-kanban-dates { display:flex; align-items:center; gap:11px; min-height:40px; padding:5px 12px; border:1px solid #d9e3f3; border-radius:8px; background:#fff; color:#273e70; }
.scrum-kanban-date { display:flex; flex-direction:column; gap:2px; white-space:nowrap; }
.scrum-kanban-date span { color:#7484a0; font-size:9px; font-weight:700; letter-spacing:.55px; }
.scrum-kanban-date strong { color:#253d72; font-size:12px; font-weight:600; }
.scrum-kanban-date-arrow { flex-shrink:0; }
@media (max-width:650px) { .scrum-kanban-dates { flex:1 1 100%; justify-content:center; } }
.scrum-kanban-category { min-width:160px; }
.scrum-kanban-search { min-width:220px; max-width:420px; flex:1; }
.scrum-kanban-toolbar__summary { display:flex; align-items:center; gap:14px; font-size:12px; color:#667792; white-space:nowrap; }
.scrum-kanban-toolbar__summary strong { color:#233e76; }
.scrum-kanban-board { display:grid; grid-template-columns:repeat(4,minmax(235px,1fr)); gap:14px; padding:0 24px 22px; flex:1; min-height:0; overflow:auto; }
.scrum-kanban-column { display:flex; flex-direction:column; min-height:240px; border:1px solid #dce5f4; border-radius:14px; background:#ebf0f9; overflow:hidden; }
.scrum-kanban-column--over { border-color:#4168bd; background:#e0eafb; }
.scrum-kanban-column__head { display:flex; align-items:center; justify-content:space-between; padding:15px; color:#253b69; border-bottom:1px solid #dce5f4; }
.scrum-kanban-column__head>div { display:flex; gap:9px; align-items:center; }
.scrum-kanban-column__dot { width:9px; height:9px; border-radius:50%; background:#8797b0; }
.scrum-kanban-column__dot--in-progress { background:#3566c6; }
.scrum-kanban-column__dot--in-review { background:#dd9c31; }
.scrum-kanban-column__dot--done { background:#21a56b; }
.scrum-kanban-column__count { border-radius:12px; background:#fff; padding:3px 9px; font-size:12px; }
.scrum-kanban-column__cards { padding:12px; overflow-y:auto; display:flex; flex-direction:column; gap:10px; flex:1; }
.scrum-kanban-task { display:flex; flex-direction:column; gap:10px; border:1px solid #d9e2f1; background:white; border-radius:10px; padding:13px; cursor:grab; box-shadow:0 2px 6px rgba(29,54,99,.04); }
.scrum-kanban-task:active { cursor:grabbing; }
.scrum-kanban-task__top,.scrum-kanban-task__meta,.scrum-kanban-task__footer { display:flex; justify-content:space-between; align-items:center; gap:8px; }
.scrum-kanban-task__title { color:#243b69; line-height:1.45; font-size:13px; }
.scrum-kanban-task__module,.scrum-kanban-task__deps { font-size:11px; color:#657895; }
.scrum-kanban-task__meta { color:#4a6592; font-size:11px; }
.scrum-kanban-task__priority { font-size:11px; color:#74829a; }
.scrum-kanban-task__footer { padding-top:6px; border-top:1px solid #edf1f8; }
.scrum-kanban-task__owner { display:flex; align-items:center; gap:5px; font-size:11px; color:#4a6085; overflow:hidden; }
.scrum-kanban-task__status { width:100%; }
.scrum-kanban-empty { text-align:center; padding:26px 8px; color:#90a0b8; border:1px dashed #cbd7e9; border-radius:9px; font-size:12px; }
.scrum-kanban-details { width:min(600px,95vw); max-width:95vw; border-radius:14px; }
@media (max-width:1100px) { .scrum-kanban-board { grid-template-columns:repeat(4,minmax(250px,1fr)); } }
@media (max-width:650px) { .scrum-kanban-toolbar { padding:12px; } .scrum-kanban-board { padding:0 12px 12px; } .scrum-kanban-toolbar__filters>* { flex:1; } }
</style>

<style scoped>
.scrum-task-preview{width:100%;height:100%;display:flex;flex-direction:column;background:#f4f7fc;color:#243457;overflow:hidden}
.scrum-task-preview__header{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;padding:17px 26px 14px;background:#fff;border-bottom:1px solid #dce5f4}
.scrum-task-preview__header h2{font-size:24px;line-height:1.3;font-weight:750;margin:6px 0;color:#182a54;display:flex;align-items:center;gap:10px}
.scrum-task-preview__header h2 .q-icon{color:#5045d5}
.scrum-task-preview__header p{font-size:12px;color:#66799b;margin:4px 0 0}
.scrum-task-preview__columns{flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:14px;padding:16px;overflow:auto}
.scrum-task-preview__left,.scrum-task-preview__right{min-width:0;border:1px solid #dce5f5;border-radius:13px;background:#fff;overflow:auto}
.scrum-task-preview__left{display:flex;flex-direction:column}
.scrum-task-preview__summary{padding:18px 20px}
.scrum-task-preview__badges{display:flex;align-items:center;flex-wrap:wrap;gap:6px}
.scrum-task-preview__task-id{font-size:14px;font-weight:800;padding:7px 10px;color:#31227f;background:#ece7ff;border-radius:8px}
.scrum-task-preview__summary h3{font-size:19px;line-height:1.4;color:#18274c;font-weight:750;margin:12px 0 6px}
.scrum-task-preview__summary p{color:#4b6085;line-height:1.6;font-size:13px;margin:0}
.scrum-task-preview__tabs{border-bottom:1px solid #d9e3f4;flex-shrink:0}
.scrum-task-preview__tabs :deep(.q-tab){min-height:46px;font-size:11px;padding:0 8px}
.scrum-task-preview__panels{padding:16px 20px;flex:1}
.scrum-task-preview__detail-list{margin:0;border:1px solid #dce5f4;border-radius:9px;padding:5px 13px}
.scrum-task-preview__detail-list>div{display:grid;grid-template-columns:135px minmax(0,1fr);gap:10px;border-bottom:1px solid #e5ebf5;padding:10px 2px;font-size:12px;line-height:1.5}
.scrum-task-preview__detail-list>div:last-child{border-bottom:0}
.scrum-task-preview__detail-list dt{font-weight:700;color:#293b61}
.scrum-task-preview__detail-list dd{margin:0;overflow-wrap:anywhere;color:#394f74}
.scrum-task-preview__actions{display:flex;flex-wrap:wrap;gap:10px;padding:14px 20px;border-top:1px solid #e1e8f5}
.scrum-task-preview__trace-head{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:17px 18px;border-bottom:1px solid #dce5f4;color:#24385d}
.scrum-task-preview__trace-head small{font-size:10px;color:#6056a0;background:#f0edff;border-radius:6px;padding:5px 8px;margin-left:auto}
.scrum-task-preview__timeline{padding:18px 22px 22px 52px}
.scrum-task-preview__trace-node{position:relative;padding:0 0 22px 24px;border-left:2px solid #bcc9e6}
.scrum-task-preview__trace-node:last-child{border-left-color:transparent;padding-bottom:0}
.scrum-task-preview__trace-marker{position:absolute;top:5px;left:-18px;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#1462c9;color:#fff;box-shadow:0 2px 5px #284b8833}
.scrum-task-preview__trace-label{display:inline-flex;font-size:12px;font-weight:800;border-radius:6px;padding:5px 10px;margin-bottom:6px}
.scrum-task-preview__trace-card{border:1px solid #bdd7fa;background:#f1f7ff;border-radius:9px;padding:12px 13px;font-size:12px;color:#263c63;overflow-wrap:anywhere}
.scrum-task-preview__trace-card>strong{font-size:14px;display:block;line-height:1.45}
.scrum-task-preview__trace-card>small{display:block;color:#66789c;margin-top:4px}
.scrum-task-preview__trace-card>p{margin:6px 0 0;line-height:1.5}
.scrum-task-preview__trace-node--module .scrum-task-preview__trace-label{background:#d7e9ff;color:#075bb8}
.scrum-task-preview__trace-node--story .scrum-task-preview__trace-marker{background:#7542db}
.scrum-task-preview__trace-node--story .scrum-task-preview__trace-label{background:#e9dfff;color:#6033b6}
.scrum-task-preview__trace-node--story .scrum-task-preview__trace-card{background:#f8f3ff;border-color:#d7c6fd}
.scrum-task-preview__trace-node--criterion .scrum-task-preview__trace-marker{background:#e49b0e}
.scrum-task-preview__trace-node--criterion .scrum-task-preview__trace-label{background:#fff0cf;color:#8b5700}
.scrum-task-preview__trace-node--criterion .scrum-task-preview__trace-card{background:#fff9ec;border-color:#f1d594}
.scrum-task-preview__criterion{display:flex;align-items:flex-start;gap:8px;background:#fff;border-radius:5px;padding:7px;margin:4px 0;opacity:.68}
.scrum-task-preview__criterion.is-linked{opacity:1;border:1px solid #d5e6bc}
.scrum-task-preview__criterion>span{background:#eee7ff;color:#55419f;border-radius:5px;font-size:10px;font-weight:750;padding:4px;white-space:nowrap}
.scrum-task-preview__criterion p{margin:2px 0 0;line-height:1.45;flex:1}
.scrum-task-preview__criterion-note{display:flex;align-items:center;gap:5px;color:#687793;margin-top:8px}

/* Dependency visualization: prerequisites → selected task → dependents */
.scrum-dependency-diagram{border:1px solid #dce5f5;border-radius:12px;overflow:hidden;background:#fff}
.scrum-dependency-diagram__header{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;padding:13px 14px;border-bottom:1px solid #e1e7f6}
.scrum-dependency-diagram__title,.scrum-dependency-diagram__legend{display:flex;align-items:center;gap:8px}
.scrum-dependency-diagram__title{font-size:13px;color:#25365a}
.scrum-dependency-diagram__legend{font-size:10px;gap:14px;color:#596b8b;flex-wrap:wrap}
.scrum-dependency-diagram__legend>span{display:flex;align-items:center;gap:5px}
.scrum-dependency-diagram__line{display:inline-block;width:20px;border-top:2px solid #8d35f3;position:relative}
.scrum-dependency-diagram__line:after{content:'';position:absolute;right:-2px;top:-4px;border-top:3px solid transparent;border-bottom:3px solid transparent;border-left:5px solid #8d35f3}
.scrum-dependency-diagram__line--post{border-color:#267bef;border-top-style:dashed}
.scrum-dependency-diagram__line--post:after{border-left-color:#267bef}
.scrum-dependency-diagram__scroll{overflow-x:auto;padding:16px 12px 20px}
.scrum-dependency-diagram__graph{display:grid;grid-template-columns:minmax(145px,1fr) 36px minmax(165px,1.1fr) 36px minmax(145px,1fr);align-items:center;min-width:560px}
.scrum-dependency-diagram__branch,.scrum-dependency-diagram__center{display:flex;flex-direction:column;gap:9px;min-width:0}
.scrum-dependency-diagram__branch-label{font-size:10px;text-align:center;font-weight:700;color:#7483a5;letter-spacing:.025em}
.scrum-dependency-diagram__node{display:flex;flex-direction:column;gap:5px;width:100%;min-width:0;border:1px solid #ced6f8;border-radius:9px;text-align:left;padding:10px;background:#f7f5ff;color:#293558;font-family:inherit;box-shadow:0 2px 5px #253d7510}
button.scrum-dependency-diagram__node{cursor:pointer;transition:border-color .15s,background .15s,transform .15s}
button.scrum-dependency-diagram__node:hover,button.scrum-dependency-diagram__node:focus-visible{border-color:#7158dc;background:#f0ebff;transform:translateY(-1px);outline:none}
.scrum-dependency-diagram__node--current{background:#edf4ff;border:2px solid #5895eb}
.scrum-dependency-diagram__node-head{display:flex;gap:4px;justify-content:space-between;align-items:center;font-size:11px}
.scrum-dependency-diagram__node-head small{border-radius:4px;padding:2px 4px;background:#e6e2ff;color:#5b47bd;font-size:9px;overflow-wrap:anywhere}
.scrum-dependency-diagram__node--current .scrum-dependency-diagram__node-head small{background:#dce9ff;color:#2458b3}
.scrum-dependency-diagram__node-title{font-size:11px;font-weight:600;line-height:1.4;overflow-wrap:anywhere}
.scrum-dependency-diagram__node-status{font-size:10px;color:#607393}
.scrum-dependency-diagram__none{padding:14px 4px;text-align:center;color:#8793ab;font-size:11px;border:1px dashed #d5dded;border-radius:8px}
.scrum-dependency-diagram__connector{height:2px;position:relative;align-self:center}
.scrum-dependency-diagram__connector--pre{background:#8d35f3}
.scrum-dependency-diagram__connector--post{border-top:2px dashed #267bef}
.scrum-dependency-diagram__connector:after{content:'';position:absolute;right:0;top:-4px;border-top:5px solid transparent;border-bottom:5px solid transparent;border-left:7px solid #8d35f3}
.scrum-dependency-diagram__connector--post:after{top:-6px;border-left-color:#267bef}
.scrum-dependency-diagram__hint{display:flex;align-items:flex-start;gap:5px;margin:0;padding:10px 13px;border-top:1px solid #e8edf8;font-size:10px;line-height:1.5;color:#6f7e9d}
.scrum-task-preview__dep-list{display:flex;flex-direction:column;gap:10px}
.scrum-task-preview__dep-row{display:flex;align-items:center;gap:12px;padding:12px;border:1px solid #dce5f4;border-radius:8px}
.scrum-task-preview__dep-row>div{flex:1;min-width:0}
.scrum-task-preview__dep-row p{font-size:12px;margin:3px 0 0;color:#607495}
.scrum-task-preview__empty{text-align:center;color:#7b8ba8;padding:32px 16px}
.scrum-task-preview__empty p{margin:8px auto;max-width:320px}
@media(max-width:900px){.scrum-task-preview__columns{grid-template-columns:1fr;overflow:auto}.scrum-task-preview__left,.scrum-task-preview__right{overflow:visible}.scrum-task-preview__detail-list>div{grid-template-columns:110px 1fr}}
@media(max-width:520px){.scrum-task-preview__columns{padding:9px;gap:9px}.scrum-task-preview__header{padding:12px}.scrum-task-preview__timeline{padding-left:39px}.scrum-task-preview__trace-head small{width:100%;margin-left:0}}
</style>

<style scoped>
.scrum-preview-collab { display:flex;flex-direction:column;gap:12px; }
.scrum-preview-collab__heading { display:flex;justify-content:space-between;align-items:center;color:#223966;gap:8px; }
.scrum-preview-collab__heading span,.scrum-preview-collab__notice {color:#72829e;font-size:11px;}
.scrum-preview-collab__empty {border:1px dashed #c9d6eb;border-radius:10px;padding:24px 14px;text-align:center;color:#7789a3;font-size:12px;}
.scrum-preview-comment,.scrum-preview-file {display:flex;gap:11px;align-items:flex-start;border:1px solid #dfe7f5;border-radius:10px;padding:12px;background:#fbfcff;}
.scrum-preview-comment__content,.scrum-preview-file__info {min-width:0;flex:1;}
.scrum-preview-comment__meta {display:flex;gap:10px;flex-wrap:wrap;align-items:center;font-size:12px;}
.scrum-preview-comment__meta span,.scrum-preview-file__info small {font-size:11px;color:#7485a0;}
.scrum-preview-comment__rich { margin-top:7px;font-size:13px;overflow-wrap:anywhere;line-height:1.55; }
.scrum-preview-comment__rich :deep(p) { margin:0 0 8px; }
.scrum-preview-comment__rich :deep(ul),.scrum-preview-comment__rich :deep(ol) { padding-left:24px;margin:6px 0; }
.scrum-preview-comment__rich :deep(img) { display:block;max-width:100%;height:auto;border-radius:8px;margin:8px 0;border:1px solid #dfe7f5; }
.scrum-preview-comment__rich :deep(blockquote) { border-left:3px solid #b5c4eb;margin:8px 0;padding:4px 12px;background:#f3f6ff; }
.scrum-preview-comment__reactions {display:flex;flex-wrap:wrap;gap:5px;margin-top:10px;}
.scrum-preview-comment__reaction {min-width:37px;min-height:28px;border-radius:14px;font-size:13px;padding:0 7px;}
.scrum-preview-comment__reaction span {font-size:11px;margin-left:4px;}
.scrum-comment-editor__extras {display:flex;align-items:center;gap:10px;flex-wrap:wrap;border-top:1px solid #e1e9f6;padding:5px 9px;}
.scrum-comment-emoji-picker {display:grid;grid-template-columns:repeat(6,36px);gap:3px;padding:9px;max-width:260px;}
.scrum-comment-emoji-picker .q-btn {font-size:19px;}
.scrum-comment-editor { border:1px solid #cbd7ea;border-radius:10px;overflow:hidden;background:white; }
.scrum-comment-editor__label { padding:10px 12px 0;font-weight:600;color:#263d6c;font-size:12px; }
.scrum-comment-editor__input { box-shadow:none!important; }
.scrum-comment-editor__hint { display:flex;align-items:center;gap:7px;color:#6a7d9d;font-size:11px; }
.scrum-preview-file {align-items:center;}
.scrum-preview-file__info {display:flex;flex-direction:column;gap:4px;overflow-wrap:anywhere;font-size:12px;}
.scrum-preview-upload {position:relative;cursor:pointer;display:flex;justify-content:center;align-items:center;gap:10px;border:1px dashed #9bb2df;background:#f5f8ff;color:#274f99;border-radius:10px;padding:18px;font-weight:600;font-size:12px;}
.scrum-preview-upload input {position:absolute;inset:0;opacity:0;width:100%;height:100%;cursor:pointer;}
.scrum-task-preview__tabs {overflow-x:auto;}
</style>
