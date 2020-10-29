/*
 * generated by Xtext 2.18.0
 */
package com.novomind.language.server.ide

import com.google.inject.Guice
import com.novomind.language.server.FixRuntimeModule
import com.novomind.language.server.FixStandaloneSetup
import org.eclipse.xtext.util.Modules2

/**
 * Initialization support for running Xtext languages as language servers.
 */
class FixIdeSetup extends FixStandaloneSetup {

	override createInjector() {
		Guice.createInjector(Modules2.mixin(new FixRuntimeModule, new FixIdeModule))
	}
	
}
